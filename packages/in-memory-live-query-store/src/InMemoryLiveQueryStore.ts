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
  GraphQLFieldResolver,
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
  identifier: string[];
  executeOperation: () => Promise<ExecutionResult>;
};

const isIDScalarType = (type: GraphQLOutputType): type is GraphQLScalarType => {
  if (isNonNullType(type)) {
    return isScalarType(type.ofType);
  }
  return false;
};

const attachIdCollectorToSchema = (schema: GraphQLSchema): GraphQLSchema => {
  return wrapSchema(schema, [
    new TransformObjectFields((typeName, fieldName, fieldConfig) => {
      if (fieldName === "id" && isIDScalarType(fieldConfig.type)) {
        let resolve = fieldConfig.resolve;
        fieldConfig.resolve = (async (src, args, context, info) => {
          const id = await resolve!(src, args, context, info);
          context?.__gatherId?.(typeName, id);
          return id;
        }) as GraphQLFieldResolver<any, any, any>;
      }
      return fieldConfig;
    }),
  ]);
};

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
      schema = attachIdCollectorToSchema(inputSchema);
      this._cache.set(inputSchema, schema);
    }

    // keep track that current execution is the latest in order to prevent race-conditions :)
    let executionCounter = 0;

    const record = {
      publishUpdate,
      identifier: [...rootFieldIdentifier],
      executeOperation: () => {
        executionCounter = executionCounter + 1;
        const counter = executionCounter;
        const newIds: string[] = [];
        return graphql({
          schema,
          source: print(operationDocument),
          operationName,
          rootValue,
          contextValue: {
            // @ts-ignore
            ...contextValue,
            __gatherId: (typeName, id) => newIds.push(`${typeName}:${id}`),
          },
          variableValues: operationVariables,
        }).finally(() => {
          if (counter === executionCounter) {
            record.identifier = [...rootFieldIdentifier, ...newIds];
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
      if (record.identifier.includes(identifier)) {
        const result = await record.executeOperation();
        record.publishUpdate(result, result);
      }
    }
  }
}
