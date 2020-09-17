import {
  DocumentNode,
  ExecutionResult,
  GraphQLSchema,
  isScalarType,
  graphql,
  print,
  isNonNullType,
  GraphQLOutputType,
  GraphQLScalarType,
} from "graphql";
import { wrapSchema, TransformObjectFields } from "@graphql-tools/wrap";
import {
  extractLiveQueries,
  LiveQueryStore,
  LiveQueryStoreRegisterParameter,
  UnsubscribeHandler,
} from "@n1ru4l/graphql-live-query";
import { extractLiveQueryRootFieldCoordinates } from "./extractLiveQueryRootFieldCoordinates";

type StoreRecord = {
  publishUpdate: (executionResult: ExecutionResult, payload: any) => void;
  identifier: Set<string>;
  executeOperation: () => Promise<ExecutionResult>;
};

const isIDScalarType = (type: GraphQLOutputType): type is GraphQLScalarType => {
  if (isNonNullType(type)) {
    return isScalarType(type.ofType);
  }
  return false;
};

const ORIGINAL_CONTEXT_SYMBOL = Symbol("ORIGINAL_CONTEXT");

const isPromise = (input: unknown): input is Promise<unknown> => {
  return (
    typeof input === "object" &&
    "then" in input &&
    typeof input["then"] === "function"
  );
};

const addResourceIdentifierCollectorToSchema = (
  schema: GraphQLSchema
): GraphQLSchema =>
  wrapSchema(schema, [
    new TransformObjectFields((typename, fieldName, fieldConfig) => {
      let isIDField = fieldName === "id" && isIDScalarType(fieldConfig.type);

      let resolve = fieldConfig.resolve;
      fieldConfig.resolve = (src, args, context, info) => {
        if (!context || !context[ORIGINAL_CONTEXT_SYMBOL]) {
          return resolve(src, args, context, info);
        }

        const gatherId = context.gatherId;
        context = context[ORIGINAL_CONTEXT_SYMBOL];
        const result = resolve(src, args, context, info);
        if (isIDField) {
          if (isPromise(result)) {
            result.then(
              (value) => gatherId(typename, value),
              () => undefined
            );
          } else {
            gatherId(typename, result);
          }
        }
        return result;
      };

      return fieldConfig;
    }),
  ]);

type ResourceGatherFunction = (typename: string, id: string) => void;

export class InMemoryLiveQueryStore implements LiveQueryStore {
  private _store = new Map<DocumentNode, StoreRecord>();
  // cache that stores all patched schema objects
  private _cache = new Map<GraphQLSchema, GraphQLSchema>();

  register({
    schema: inputSchema,
    operationDocument,
    rootValue,
    contextValue,
    operationVariables,
    operationName,
    publishUpdate,
  }: LiveQueryStoreRegisterParameter): UnsubscribeHandler {
    const [liveQuery] = extractLiveQueries(operationDocument);
    if (!liveQuery) {
      throw new Error("Cannot register live query for the given document.");
    }

    const rootFieldIdentifier = extractLiveQueryRootFieldCoordinates(
      operationDocument,
      operationName
    );

    let schema = this._cache.get(inputSchema);
    if (!schema) {
      schema = addResourceIdentifierCollectorToSchema(inputSchema);
      this._cache.set(inputSchema, schema);
    }

    // keep track that current execution is the latest in order to prevent race-conditions :)
    let executionCounter = 0;

    const record = {
      publishUpdate,
      identifier: new Set(rootFieldIdentifier),
      executeOperation: () => {
        executionCounter = executionCounter + 1;
        const counter = executionCounter;
        const newIdentifier = new Set(rootFieldIdentifier);
        const gatherId: ResourceGatherFunction = (typename, id) =>
          newIdentifier.add(`${typename}:${id}`);

        return graphql({
          schema,
          source: print(operationDocument),
          operationName,
          rootValue,
          contextValue: {
            [ORIGINAL_CONTEXT_SYMBOL]: contextValue,
            gatherId,
          },
          variableValues: operationVariables,
        }).finally(() => {
          if (counter === executionCounter) {
            record.identifier = newIdentifier;
          }
        });
      },
    };
    this._store.set(operationDocument, record);
    // Execute initial query
    record
      .executeOperation()
      .then((result) => record.publishUpdate(result, result));

    return () => void this._store.delete(operationDocument);
  }

  async triggerUpdate(identifier: string) {
    for (const record of this._store.values()) {
      if (record.identifier.has(identifier)) {
        const result = await record.executeOperation();
        record.publishUpdate(result, result);
      }
    }
  }
}
