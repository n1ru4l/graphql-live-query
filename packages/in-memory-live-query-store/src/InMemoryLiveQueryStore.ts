import {
  ExecutionResult,
  GraphQLSchema,
  execute as defaultExecute,
  ExecutionArgs,
  GraphQLError,
  getOperationAST,
  defaultFieldResolver,
  TypeInfo,
} from "graphql";
import { mapSchema, MapperKind, isAsyncIterable } from "@graphql-tools/utils";
import { Repeater } from "@repeaterjs/repeater";
import {
  getLiveDirectiveArgumentValues,
  LiveExecutionResult,
  getLiveDirectiveNode,
} from "@n1ru4l/graphql-live-query";
import { extractLiveQueryRootFieldCoordinates } from "./extractLiveQueryRootFieldCoordinates";
import { isNonNullIDScalarType } from "./isNonNullIDScalarType";
import { runWith } from "./runWith";
import { isNone, isSome, None, Maybe } from "./Maybe";
import { ResourceTracker } from "./ResourceTracker";
import { throttle } from "./throttle";

type PromiseOrValue<T> = T | Promise<T>;

type ResourceIdentifierCollectorFunction = (
  parameter: Readonly<{
    typename: string;
    id: string;
  }>
) => void;
type AddResourceIdentifierFunction = (
  values: string | Iterable<string> | None
) => void;

const ORIGINAL_CONTEXT_SYMBOL = Symbol("ORIGINAL_CONTEXT");

type ArgumentName = string;
type ArgumentValue = string;
type IndexConfiguration = Array<
  ArgumentName | [arg: ArgumentName, value: ArgumentValue]
>;

type LiveQueryContextValue = {
  [ORIGINAL_CONTEXT_SYMBOL]: unknown;
  collectResourceIdentifier: ResourceIdentifierCollectorFunction;
  addResourceIdentifier: AddResourceIdentifierFunction;
  indices: Map<string, Array<IndexConfiguration>> | null;
};

const addResourceIdentifierCollectorToSchema = (
  schema: GraphQLSchema,
  idFieldName: string
): GraphQLSchema =>
  mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig, fieldName, typename) => {
      const newFieldConfig = { ...fieldConfig };

      let isIDField =
        fieldName === idFieldName && isNonNullIDScalarType(fieldConfig.type);
      let resolve = fieldConfig.resolve ?? defaultFieldResolver;

      newFieldConfig.resolve = (src, args, context, info) => {
        if (!context || ORIGINAL_CONTEXT_SYMBOL in context === false) {
          return resolve(src, args, context, info);
        }

        const liveQueyContext = context as LiveQueryContextValue;
        const result = resolve(
          src,
          args,
          liveQueyContext[ORIGINAL_CONTEXT_SYMBOL],
          info
        ) as any;

        const fieldConfigExtensions = fieldConfig.extensions as any | undefined;
        if (fieldConfigExtensions?.liveQuery?.collectResourceIdentifiers) {
          liveQueyContext.addResourceIdentifier(
            fieldConfigExtensions.liveQuery.collectResourceIdentifiers(
              src,
              args
            )
          );
        }

        const fieldCoordinate = `${typename}.${fieldName}`;
        const indicesForCoordinate =
          liveQueyContext.indices?.get(fieldCoordinate);

        if (indicesForCoordinate) {
          for (const index of indicesForCoordinate) {
            let parts: Array<string> = [];
            for (const part of index) {
              if (Array.isArray(part)) {
                if (args[part[0]] === part[1]) {
                  parts.push(`${part[0]}:"${args[part[0]]}"`);
                }
              } else if (args[part] !== undefined) {
                parts.push(`${part}:"${args[part]}"`);
              }
            }
            if (parts.length) {
              liveQueyContext.addResourceIdentifier(
                `${fieldCoordinate}(${parts.join(",")})`
              );
            }
          }
        }

        if (isIDField) {
          runWith(result, (id: string) =>
            liveQueyContext.collectResourceIdentifier({ typename, id })
          );
        }
        return result;
      };

      return newFieldConfig;
    },
  });

export type BuildResourceIdentifierFunction = (
  parameter: Readonly<{
    typename: string;
    id: string;
  }>
) => string;

export const defaultResourceIdentifierNormalizer: BuildResourceIdentifierFunction =
  (params) => `${params.typename}:${params.id}`;

export type ValidateThrottleValueFunction = (
  throttleValue: Maybe<number>
) => Maybe<string | number>;

export type InMemoryLiveQueryStoreParameter = {
  /**
   * Custom function for building resource identifiers.
   * By default resource identifiers are built by concatenating the Typename with the id separated by a color (`User:1`).
   * See `defaultResourceIdentifierNormalizer`
   *
   * This may be useful if you are using a relay compliant schema and the Typename information is not required for building a unique topic.
   * */
  buildResourceIdentifier?: BuildResourceIdentifierFunction;
  /**
   * Function which is used for executing the operations.
   *
   * Uses the `execute` exported from graphql be default.
   *
   * @deprecated Please use the InMemoryStore.createExecute method instead.
   * */
  execute?: typeof defaultExecute;
  /**
   * Whether the extensions should include a list of all resource identifiers for the latest operation result.
   * Any of those can be used for invalidating and re-scheduling the operation execution.
   *
   * This is mainly useful for discovering and learning what kind of topics a given query will subscribe to.
   * The default value is `true` if `process.env.NODE_ENV` is equal to `"development"` and `false` otherwise.
   * */
  includeIdentifierExtension?: boolean;
  idFieldName?: string;
  /**
   * Validate the provided throttle value.
   *
   * Return a string for triggering an error and stopping the execution.
   * Return a number for overriding the provided value.
   * Return null or undefined for disabling throttle completely.
   */
  validateThrottleValue?: ValidateThrottleValueFunction;
  /**
   * Specify which fields should be indexed for specific invalidations.
   */
  indexBy?: Array<{ field: string; args: IndexConfiguration }>;
};

type SchemaCacheRecord = {
  schema: GraphQLSchema;
  typeInfo: TypeInfo;
};

type LiveExecuteReturnType = PromiseOrValue<
  // TODO: change this to AsyncGenerator once we drop support for GraphQL.js 15
  AsyncIterableIterator<ExecutionResult | LiveExecutionResult> | ExecutionResult
>;

export class InMemoryLiveQueryStore {
  private _resourceTracker = new ResourceTracker<() => void>();
  private _schemaCache = new WeakMap<GraphQLSchema, SchemaCacheRecord>();
  private _buildResourceIdentifier = defaultResourceIdentifierNormalizer;
  private _execute = defaultExecute;
  private _includeIdentifierExtension = false;
  private _idFieldName = "id";
  private _validateThrottleValue: Maybe<ValidateThrottleValueFunction>;
  private _indices: Map<string, Array<IndexConfiguration>> | null = null;

  constructor(params?: InMemoryLiveQueryStoreParameter) {
    if (params?.buildResourceIdentifier) {
      this._buildResourceIdentifier = params.buildResourceIdentifier;
    }
    if (params?.execute) {
      this._execute = params.execute;
    }
    if (params?.idFieldName) {
      this._idFieldName = params.idFieldName;
    }
    if (params?.validateThrottleValue) {
      this._validateThrottleValue = params.validateThrottleValue;
    }
    if (params?.indexBy) {
      this._indices = new Map();
      for (const { field, args } of params.indexBy) {
        let indices = this._indices.get(field);
        if (!indices) {
          indices = [];
          this._indices.set(field, indices);
        }
        indices.push(args);
      }
    }
    this._includeIdentifierExtension =
      params?.includeIdentifierExtension ??
      (typeof process === "undefined"
        ? false
        : process?.env?.NODE_ENV === "development");
  }

  private _getPatchedSchema(inputSchema: GraphQLSchema): SchemaCacheRecord {
    let data = this._schemaCache.get(inputSchema);
    if (isNone(data)) {
      const schema = addResourceIdentifierCollectorToSchema(
        inputSchema,
        this._idFieldName
      );
      data = {
        schema,
        typeInfo: new TypeInfo(schema),
      };
      this._schemaCache.set(inputSchema, data);
    }
    return data;
  }

  makeExecute =
    (execute: typeof defaultExecute) =>
    (args: ExecutionArgs): LiveExecuteReturnType => {
      const {
        schema: inputSchema,
        document,
        rootValue,
        contextValue,
        variableValues,
        operationName,
        ...additionalArguments
      } = args;

      const operationNode = getOperationAST(document, operationName);

      const fallbackToDefaultExecute = () =>
        execute({
          schema: inputSchema,
          document,
          rootValue,
          contextValue,
          variableValues,
          operationName,
          ...additionalArguments,
        }) as LiveExecuteReturnType;

      if (isNone(operationNode)) {
        return fallbackToDefaultExecute();
      }

      const liveDirectiveNode = getLiveDirectiveNode(operationNode);

      if (isNone(liveDirectiveNode)) {
        return fallbackToDefaultExecute();
      }

      let { isLive, throttleValue } = getLiveDirectiveArgumentValues(
        liveDirectiveNode,
        variableValues
      );

      if (isLive === false) {
        return fallbackToDefaultExecute();
      }

      if (isSome(this._validateThrottleValue)) {
        const maybeErrorOrNewThrottleValue =
          this._validateThrottleValue(throttleValue);
        if (typeof maybeErrorOrNewThrottleValue === "string") {
          return {
            errors: [
              new GraphQLError(maybeErrorOrNewThrottleValue, [
                liveDirectiveNode,
              ]),
            ],
          };
        } else {
          throttleValue = maybeErrorOrNewThrottleValue;
        }
      }

      const { schema, typeInfo } = this._getPatchedSchema(inputSchema);

      const rootFieldIdentifier = Array.from(
        extractLiveQueryRootFieldCoordinates({
          documentNode: document,
          operationNode,
          variableValues,
          typeInfo,
        })
      );

      const context = this;

      return new Repeater<
        ExecutionResult | LiveExecutionResult | ExecutionResult
      >(async function liveQueryRepeater(push, onStop) {
        // utils for throttle
        let cancelThrottle: Function | undefined;
        let run: () => void;

        let executionCounter = 0;
        let previousIdentifier = new Set<string>(rootFieldIdentifier);

        function scheduleRun() {
          run();
        }

        function dispose() {
          cancelThrottle?.();
          context._resourceTracker.release(scheduleRun, previousIdentifier);
        }

        onStop.then(dispose);

        run = function run() {
          executionCounter = executionCounter + 1;
          const counter = executionCounter;

          const newIdentifier = new Set(rootFieldIdentifier);
          const collectResourceIdentifier: ResourceIdentifierCollectorFunction =
            (parameter) =>
              newIdentifier.add(context._buildResourceIdentifier(parameter));

          const addResourceIdentifier: AddResourceIdentifierFunction = (
            values
          ) => {
            if (isNone(values)) {
              return;
            }
            if (typeof values === "string") {
              newIdentifier.add(values);
              return;
            }
            for (const value of values) {
              newIdentifier.add(value);
            }
          };

          const context: LiveQueryContextValue = {
            [ORIGINAL_CONTEXT_SYMBOL]: contextValue,
            collectResourceIdentifier,
            addResourceIdentifier,
            indices: this._indices,
          };

          const result = execute({
            schema,
            document,
            operationName,
            rootValue,
            contextValue: context,
            variableValues,
            ...additionalArguments,
            // TODO: remove this type-cast once GraphQL.js 16-defer-stream with fixed return type got released
          }) as LiveExecuteReturnType;

          runWith(result, (result) => {
            if (isAsyncIterable(result)) {
              onStop(
                new Error(
                  `"execute" returned a AsyncIterator instead of a MaybePromise<ExecutionResult>. The "NoLiveMixedWithDeferStreamRule" rule might have been skipped.`
                )
              );
              return;
            }
            if (counter === executionCounter) {
              context._resourceTracker.track(
                scheduleRun,
                previousIdentifier,
                newIdentifier
              );
              previousIdentifier = newIdentifier;
              const liveResult: LiveExecutionResult = result;
              liveResult.isLive = true;
              if (context._includeIdentifierExtension === true) {
                if (!liveResult.extensions) {
                  liveResult.extensions = {};
                }
                liveResult.extensions.liveResourceIdentifier =
                  Array.from(newIdentifier);
              }

              push(liveResult);
            }
          });
        };

        if (isSome(throttleValue)) {
          const throttled = throttle(run, throttleValue);
          run = throttled.run;
          cancelThrottle = throttled.cancel;
        }

        context._resourceTracker.register(scheduleRun, previousIdentifier);
        scheduleRun();
      });
    };

  /** @deprecated Please use InMemoryLiveQueryStore.makeExecute instead. */
  execute = this.makeExecute(this._execute);

  /**
   * Invalidate queries (and schedule their re-execution) via a resource identifier.
   * @param identifiers A single or list of resource identifiers that should be invalidated.
   */
  async invalidate(identifiers: Array<string> | string) {
    if (typeof identifiers === "string") {
      identifiers = [identifiers];
    }

    const records = this._resourceTracker.getRecordsForIdentifiers(identifiers);

    for (const run of records) {
      run();
    }
  }
}
