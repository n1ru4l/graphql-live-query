import { DocumentNode, ExecutionResult, GraphQLSchema, execute } from "graphql";
import { wrapSchema, TransformObjectFields } from "@graphql-tools/wrap";
import {
  extractLiveQueries,
  LiveQueryStore,
  LiveQueryStoreRegisterParameter,
  UnsubscribeHandler,
} from "@n1ru4l/graphql-live-query";
import { extractLiveQueryRootFieldCoordinates } from "./extractLiveQueryRootFieldCoordinates";
import { isNonNullIDScalarType } from "./isNonNullIDScalarType";
import { runWith } from "./runWith";

type PromiseOrValue<T> = T | Promise<T>;
type StoreRecord = {
  publishUpdate: (executionResult: ExecutionResult, payload: any) => void;
  identifier: Set<string>;
  executeOperation: () => PromiseOrValue<ExecutionResult>;
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
};

export class InMemoryLiveQueryStore implements LiveQueryStore {
  private _store = new Map<DocumentNode, StoreRecord>();
  // cache that stores all patched schema objects
  private _cache = new Map<GraphQLSchema, GraphQLSchema>();
  private _buildResourceIdentifier = defaultResourceIdentifierNormalizer;

  constructor(params?: InMemoryLiveQueryStoreParameter) {
    if (params?.buildResourceIdentifier) {
      this._buildResourceIdentifier = params.buildResourceIdentifier;
    }
  }

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
        const collectResourceIdentifier: ResourceIdentifierCollectorFunction = (
          parameter
        ) => newIdentifier.add(this._buildResourceIdentifier(parameter));

        const result = execute({
          schema,
          document: operationDocument,
          operationName,
          rootValue,
          contextValue: {
            [ORIGINAL_CONTEXT_SYMBOL]: contextValue,
            collectResourceIdentifier,
          },
          variableValues: operationVariables,
        });

        runWith(result, () => {
          if (counter === executionCounter) {
            record.identifier = newIdentifier;
          }
        });

        return result;
      },
    };

    this._store.set(operationDocument, record);
    // Execute initial query
    runWith(record.executeOperation(), (result) => {
      record.publishUpdate(result, result);
    });

    return () => void this._store.delete(operationDocument);
  }

  async emit(identifiers: string[] | string) {
    if (typeof identifiers === "string") {
      identifiers = [identifiers];
    }

    // Todo it might be better to simply use a hash map of the events ninstead of iterating through everything...
    for (const identifier of identifiers) {
      for (const record of this._store.values()) {
        if (record.identifier.has(identifier)) {
          const result = await record.executeOperation();
          record.publishUpdate(result, result);
        }
      }
    }
  }
}
