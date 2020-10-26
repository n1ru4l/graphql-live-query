import {
  DocumentNode,
  ExecutionResult,
  GraphQLSchema,
  execute as defaultExecute,
  GraphQLError,
  ExecutionArgs,
} from "graphql";
import { wrapSchema, TransformObjectFields } from "@graphql-tools/wrap";
import { extractLiveQueries } from "@n1ru4l/graphql-live-query";
import { extractLiveQueryRootFieldCoordinates } from "./extractLiveQueryRootFieldCoordinates";
import { isNonNullIDScalarType } from "./isNonNullIDScalarType";
import { runWith } from "./runWith";
import { PushPullAsyncIterableIterator } from "./PushPullAsyncIterableIterator";

type PromiseOrValue<T> = T | Promise<T>;
type StoreRecord = {
  iterator: PushPullAsyncIterableIterator<ExecutionResult>;
  identifier: Set<string>;
  run: () => PromiseOrValue<void>;
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
  wrapSchema(schema, [
    new TransformObjectFields((typename, fieldName, fieldConfig) => {
      let isIDField =
        fieldName === "id" && isNonNullIDScalarType(fieldConfig.type);

      let resolve = fieldConfig.resolve;
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
  ]);

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
  buildResourceIdentifier?: BuildResourceIdentifierFunction;
  execute?: typeof defaultExecute;
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

  execute = async ({
    schema: inputSchema,
    document,
    rootValue,
    contextValue,
    variableValues,
    operationName,
  }: ExecutionArgs): Promise<
    AsyncIterableIterator<ExecutionResult> | ExecutionResult
  > => {
    const liveQueries = extractLiveQueries(document);
    if (liveQueries.length === 0) {
      return this._execute({
        schema: inputSchema,
        document,
        rootValue,
        contextValue,
        variableValues,
        operationName,
      });
    } else if (liveQueries.length !== 1) {
      return {
        errors: [
          new GraphQLError(
            "Query document is only allowed to contain one query annotated with @live."
          ),
        ],
      };
    }

    const rootFieldIdentifier = extractLiveQueryRootFieldCoordinates(
      document,
      operationName
    );

    let schema = this._cache.get(inputSchema);
    if (!schema) {
      schema = addResourceIdentifierCollectorToSchema(inputSchema);
      this._cache.set(inputSchema, schema);
    }

    let record: StoreRecord;

    const iterator = new PushPullAsyncIterableIterator<ExecutionResult>(() => {
      this._store.delete(record);
    });

    // keep track that current execution is the latest in order to prevent race-conditions :)
    let executionCounter = 0;

    record = {
      iterator,
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
        });

        runWith(result, (result) => {
          if (counter === executionCounter) {
            record.identifier = newIdentifier;
            record.iterator.push(result);
          }
        });
      },
    };

    this._store.add(record);
    // Execute initial query
    record.run();

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
