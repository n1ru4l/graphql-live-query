import {
  ExecutionResult,
  GraphQLSchema,
  execute as defaultExecute,
  ExecutionArgs,
  DefinitionNode,
  OperationDefinitionNode,
  GraphQLError,
} from "graphql";
import { wrapSchema, TransformObjectFields } from "@graphql-tools/wrap";
import {
  makePushPullAsyncIterableIterator,
  isAsyncIterable,
} from "@n1ru4l/push-pull-async-iterable-iterator";
import {
  isLiveQueryOperationDefinitionNode,
  LiveExecutionResult,
} from "@n1ru4l/graphql-live-query";
import { extractLiveQueryRootFieldCoordinates } from "./extractLiveQueryRootFieldCoordinates";
import { isNonNullIDScalarType } from "./isNonNullIDScalarType";
import { runWith } from "./runWith";
import { isNone } from "./Maybe";

type MaybePromise<T> = T | Promise<T>;
type StoreRecord = {
  iterator: AsyncIterableIterator<LiveExecutionResult>;
  pushValue: (value: LiveExecutionResult) => void;
  identifier: Set<string>;
  run: () => MaybePromise<void>;
};

type ResourceIdentifierCollectorFunction = (
  parameter: Readonly<{
    typename: string;
    id: string;
  }>
) => void;

const ORIGINAL_CONTEXT_SYMBOL = Symbol("ORIGINAL_CONTEXT");

const addResourceIdentifierCollectorToSchema = (
  schema: GraphQLSchema
): GraphQLSchema =>
  wrapSchema({
    schema,
    transforms: [
      new TransformObjectFields((typename, fieldName, fieldConfig) => {
        let isIDField =
          fieldName === "id" && isNonNullIDScalarType(fieldConfig.type);

        let resolve = fieldConfig.resolve!;
        fieldConfig.resolve = (src, args, context, info) => {
          if (!context || !context[ORIGINAL_CONTEXT_SYMBOL]) {
            return resolve(src, args, context, info);
          }

          const collectResourceIdentifier: ResourceIdentifierCollectorFunction =
            context.collectResourceIdentifier;
          context = context[ORIGINAL_CONTEXT_SYMBOL];
          const result = resolve(src, args, context, info);
          if (isIDField) {
            runWith(result, (id: string) =>
              collectResourceIdentifier({ typename, id })
            );
          }
          return result;
        };

        return fieldConfig;
      }),
    ],
  });

export type BuildResourceIdentifierFunction = (
  parameter: Readonly<{
    typename: string;
    id: string;
  }>
) => string;

export const defaultResourceIdentifierNormalizer: BuildResourceIdentifierFunction = (
  params
) => `${params.typename}:${params.id}`;

type InMemoryLiveQueryStoreParameter = {
  /* Custom function for building resource identifiers. By default resource identifiers are built by concatenating the Typename with the id separated by a color (`User:1`). See `defaultResourceIdentifierNormalizer` */
  buildResourceIdentifier?: BuildResourceIdentifierFunction;
  /* Function which is used for executing the operations. Uses the `execute` exported from graphql be default. */
  execute?: typeof defaultExecute;
};

const isOperationDefinitionNode = (
  input: DefinitionNode
): input is OperationDefinitionNode => input.kind === "OperationDefinition";

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

export class InMemoryLiveQueryStore {
  private _store = new Set<StoreRecord>();
  // cache that stores all patched schema objects
  private _cache = new Map<GraphQLSchema, GraphQLSchema>();
  private _buildResourceIdentifier = defaultResourceIdentifierNormalizer;
  private _execute = defaultExecute;

  constructor(params?: InMemoryLiveQueryStoreParameter) {
    if (params?.buildResourceIdentifier) {
      this._buildResourceIdentifier = params.buildResourceIdentifier;
    }
    if (params?.execute) {
      this._execute = params.execute;
    }
  }

  private getPatchedSchema(inputSchema: GraphQLSchema): GraphQLSchema {
    let schema = this._cache.get(inputSchema);
    if (isNone(schema)) {
      schema = addResourceIdentifierCollectorToSchema(inputSchema);
      this._cache.set(inputSchema, schema);
    }
    return schema;
  }

  execute = (
    ...args: ExecutionParameter
  ): MaybePromise<
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

    const operationDefinitions = document.definitions.filter(
      isOperationDefinitionNode
    );

    const fallbackToDefaultExecute = () =>
      this._execute({
        schema: inputSchema,
        document,
        rootValue,
        contextValue,
        variableValues,
        operationName,
        ...additionalArguments,
      });

    if (
      (isNone(operationName) && operationDefinitions.length > 1) ||
      operationDefinitions.length === 0
    ) {
      return fallbackToDefaultExecute();
    }

    const operationNode =
      operationDefinitions.length === 1
        ? operationDefinitions[0]
        : operationDefinitions.find(
            (operation) => operation.name?.value === operationName
          );

    if (
      isNone(operationNode) ||
      isLiveQueryOperationDefinitionNode(operationNode) === false
    ) {
      return fallbackToDefaultExecute();
    }

    const rootFieldIdentifier = extractLiveQueryRootFieldCoordinates(
      document,
      operationNode
    );

    const schema = this.getPatchedSchema(inputSchema);

    const {
      asyncIterableIterator: iterator,
      pushValue,
    } = makePushPullAsyncIterableIterator<LiveExecutionResult>();

    // keep track that current execution is the latest in order to prevent race-conditions :)
    let executionCounter = 0;

    const record: StoreRecord = {
      iterator,
      pushValue,
      identifier: new Set(rootFieldIdentifier),
      run: () => {
        executionCounter = executionCounter + 1;
        const counter = executionCounter;
        const newIdentifier = new Set(rootFieldIdentifier);
        const collectResourceIdentifier: ResourceIdentifierCollectorFunction = (
          parameter
        ) => newIdentifier.add(this._buildResourceIdentifier(parameter));

        const result = this._execute({
          schema,
          document,
          operationName,
          rootValue,
          contextValue: {
            [ORIGINAL_CONTEXT_SYMBOL]: contextValue,
            collectResourceIdentifier,
          },
          variableValues,
          ...additionalArguments,
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
          (process?.nextTick ?? setTimeout)(() => {
            record.iterator?.return?.();
          });

          this._store.delete(record);
        };

        runWith(result, (result) => {
          if (isAsyncIterable(result)) {
            handleAsyncIterator(result);
            return;
          }
          if (counter === executionCounter) {
            record.identifier = newIdentifier;
            const liveResult: LiveExecutionResult = result;
            liveResult.isLive = true;
            record.pushValue(liveResult);
          }
        });
      },
    };

    this._store.add(record);
    // Execute initial query
    record.run();

    const originalReturn = iterator.return;
    iterator.return = () => {
      this._store.delete(record);
      return originalReturn
        ? originalReturn()
        : Promise.resolve({ done: true, value: undefined });
    };

    return iterator;
  };

  /**
   * Invalidate queries (and schedule their re-execution) via a resource identifier.
   * @param identifiers A single or list of resource identifiers that should be invalidated.
   */
  async invalidate(identifiers: string[] | string) {
    if (typeof identifiers === "string") {
      identifiers = [identifiers];
    }

    const invalidatedRecords = new Set<StoreRecord>();

    // Todo: it might be better to simply use a hash map of the events instead of iterating through everything...
    for (const identifier of identifiers) {
      for (const record of this._store.values()) {
        if (record.identifier.has(identifier)) {
          invalidatedRecords.add(record);
        }
      }
    }
    for (const record of invalidatedRecords) {
      record.run();
    }
  }
}
