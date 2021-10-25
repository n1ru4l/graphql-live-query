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
import { getArgumentValues } from "graphql/execution/values.js";
import { mapSchema, MapperKind } from "@graphql-tools/utils";
import {
  makePushPullAsyncIterableIterator,
  isAsyncIterable,
} from "@n1ru4l/push-pull-async-iterable-iterator";
import {
  getLiveDirectiveArgumentValues,
  LiveExecutionResult,
  getLiveDirectiveNode,
} from "@n1ru4l/graphql-live-query";
import {
  extractLiveQueryRootFieldArgumentValues,
  extractLiveQueryRootFieldCoordinates,
} from "./extractLiveQueryRootFieldCoordinates";
import { isNonNullIDScalarType } from "./isNonNullIDScalarType";
import { runWith } from "./runWith";
import { isNone, isSome, None, Maybe } from "./Maybe";
import { ResourceTracker } from "./ResourceTracker";
import { throttle } from "./throttle";

type PromiseOrValue<T> = T | Promise<T>;
type StoreRecord = {
  iterator: AsyncIterableIterator<LiveExecutionResult>;
  pushValue: (value: LiveExecutionResult) => void;
  run: () => PromiseOrValue<void>;
  fields: Map<string, ReturnType<typeof getArgumentValues>>;
  parameters: ExecutionArgs;
};

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

        const collectResourceIdentifier: ResourceIdentifierCollectorFunction =
          context.collectResourceIdentifier;
        const addResourceIdentifier: AddResourceIdentifierFunction =
          context.addResourceIdentifier;
        context = context[ORIGINAL_CONTEXT_SYMBOL];
        const result = resolve(src, args, context, info);

        if (fieldConfig.extensions?.liveQuery?.collectResourceIdentifiers) {
          addResourceIdentifier(
            fieldConfig.extensions.liveQuery.collectResourceIdentifiers(
              src,
              args
            )
          );
        }

        if (isIDField) {
          runWith(result, (id: string) =>
            collectResourceIdentifier({ typename, id })
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

type InMemoryLiveQueryStoreParameter = {
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
};

// TODO: Investigate why parameters does not return a union...
type ExecutionParameter = Parameters<typeof defaultExecute> | [ExecutionArgs];

/* Utility for getting the parameters for the union parameter input type as a object. */
const getExecutionParameters = (params: ExecutionParameter): ExecutionArgs => {
  if (params.length === 1) {
    return params[0];
  }
  const [
    schema,
    document,
    rootValue,
    contextValue,
    variableValues,
    operationName,
    fieldResolver,
    typeResolver,
  ] = params;

  return {
    schema,
    document,
    rootValue,
    contextValue,
    variableValues,
    operationName,
    fieldResolver,
    typeResolver,
  };
};

const nextTick =
  (typeof process === "object" && typeof process.nextTick === "function"
    ? process.nextTick
    : undefined) ??
  setImmediate ??
  setTimeout;

type SchemaCacheRecord = {
  schema: GraphQLSchema;
  typeInfo: TypeInfo;
};

export class InMemoryLiveQueryStore {
  private _resourceTracker = new ResourceTracker<StoreRecord>();
  private _schemaCache = new WeakMap<GraphQLSchema, SchemaCacheRecord>();
  private _buildResourceIdentifier = defaultResourceIdentifierNormalizer;
  private _execute = defaultExecute;
  private _includeIdentifierExtension = false;
  private _idFieldName = "id";
  private _validateThrottleValue: Maybe<ValidateThrottleValueFunction>;

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
    this._includeIdentifierExtension =
      params?.includeIdentifierExtension ??
      (typeof process === "undefined"
        ? false
        : process?.env?.NODE_ENV === "development");
  }

  private getPatchedSchema(inputSchema: GraphQLSchema): SchemaCacheRecord {
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
    (
      ...args: ExecutionParameter
    ): PromiseOrValue<
      | AsyncIterableIterator<ExecutionResult | LiveExecutionResult>
      | ExecutionResult
    > => {
      const {
        schema: inputSchema,
        document,
        rootValue,
        contextValue,
        variableValues,
        operationName,
        ...additionalArguments
      } = getExecutionParameters(args);

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
        });

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

      const { schema, typeInfo } = this.getPatchedSchema(inputSchema);

      const rootFieldIdentifier = Array.from(
        extractLiveQueryRootFieldCoordinates({
          documentNode: document,
          operationNode,
          variableValues,
          typeInfo,
        })
      );

      const { asyncIterableIterator: iterator, pushValue } =
        makePushPullAsyncIterableIterator<LiveExecutionResult>();

      // keep track that current execution is the latest in order to prevent race-conditions :)
      let executionCounter = 0;
      let previousIdentifier = new Set<string>(rootFieldIdentifier);

      // extracting the arguments values for each root query field (useful when invalidating by predicate)
      const fields = extractLiveQueryRootFieldArgumentValues({
        documentNode: document,
        operationNode,
        variableValues,
        typeInfo,
      });

      const executionParameters: ExecutionArgs = {
        schema,
        document,
        operationName,
        rootValue,
        contextValue,
        variableValues,
        ...additionalArguments,
      };

      const record: StoreRecord = {
        iterator,
        pushValue,
        run: () => {
          executionCounter = executionCounter + 1;
          const counter = executionCounter;
          const newIdentifier = new Set(rootFieldIdentifier);
          const collectResourceIdentifier: ResourceIdentifierCollectorFunction =
            (parameter) =>
              newIdentifier.add(this._buildResourceIdentifier(parameter));

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

          const result = execute({
            ...executionParameters,
            contextValue: {
              [ORIGINAL_CONTEXT_SYMBOL]: executionParameters.contextValue,
              collectResourceIdentifier,
              addResourceIdentifier,
            },
          });

          // result cannot be a AsyncIterableIterator if the `NoLiveMixedWithDeferStreamRule` was used.
          // in case anyone forgot to add it we just panic and stop the execution :)
          const handleAsyncIterator = (
            iterator: AsyncIterable<ExecutionResult>
          ) => {
            iterator[Symbol.asyncIterator]().return?.();

            record.pushValue({
              errors: [
                new GraphQLError(
                  `"execute" returned a AsyncIterator instead of a MaybePromise<ExecutionResult>. The "NoLiveMixedWithDeferStreamRule" rule might have been skipped.`
                ),
              ],
            });

            // delay to next tick to ensure the error is delivered to listeners.
            // TODO: figure out whether there is a better way for doing this.
            nextTick(() => {
              record.iterator.return!();
            });

            this._resourceTracker.release(record, previousIdentifier);
          };

          runWith(result, (result) => {
            if (isAsyncIterable(result)) {
              handleAsyncIterator(result);
              return;
            }
            if (counter === executionCounter) {
              this._resourceTracker.track(
                record,
                previousIdentifier,
                newIdentifier
              );
              previousIdentifier = newIdentifier;
              const liveResult: LiveExecutionResult = result;
              liveResult.isLive = true;
              if (this._includeIdentifierExtension === true) {
                if (!liveResult.extensions) {
                  liveResult.extensions = {};
                }
                liveResult.extensions.liveResourceIdentifier =
                  Array.from(newIdentifier);
              }
              record.pushValue(liveResult);
            }
          });
        },
        fields,
        parameters: executionParameters,
      };

      // utils for throttle
      let cancelThrottle: Function | undefined;

      if (isSome(throttleValue)) {
        const { run, cancel } = throttle(record.run, throttleValue);
        record.run = run;
        cancelThrottle = cancel;
      }

      this._resourceTracker.register(record, previousIdentifier);
      // Execute initial query
      record.run();

      // TODO: figure out how we can do this stuff without monkey-patching the iterator
      const originalReturn = iterator.return!.bind(iterator);
      iterator.return = () => {
        cancelThrottle?.();
        this._resourceTracker.release(record, previousIdentifier);
        return originalReturn();
      };

      return iterator;
    };

  execute = this.makeExecute(this._execute);

  /**
   * Invalidate queries (and schedule their re-execution) via a resource identifier.
   * @param identifiers A single or list of resource identifiers that should be invalidated.
   */
  async invalidate(
    identifiers: Array<string> | string | ((record: StoreRecord) => boolean)
  ) {
    let records: Set<StoreRecord>;

    if (typeof identifiers === "function") {
      records = this._resourceTracker.getRecordsForPredicate(identifiers);
    } else {
      if (typeof identifiers === "string") {
        identifiers = [identifiers];
      }
      records = this._resourceTracker.getRecordsForIdentifiers(identifiers);
    }

    for (const record of records) {
      record.run();
    }
  }
}
