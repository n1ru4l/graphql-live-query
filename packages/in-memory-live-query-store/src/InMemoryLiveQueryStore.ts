import {
  ExecutionResult,
  GraphQLSchema,
  execute as defaultExecute,
  ExecutionArgs,
  GraphQLError,
  getOperationAST,
  GraphQLObjectType,
  GraphQLInterfaceType,
  isInterfaceType,
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
import { isNone, None, isSome } from "./Maybe";
import { ResourceTracker } from "./ResourceTracker";
import { pathToArray } from "graphql/jsutils/Path";
import { buildNodeInterfaceRefetchQueryDocuments } from "./buildNodeInterfaceRefetchQueryDocuments";

type MaybePromise<T> = T | Promise<T>;
type StoreRecord = {
  iterator: AsyncIterableIterator<LiveExecutionResult>;
  pushValue: (value: LiveExecutionResult) => void;
  run: (identifiers: Set<string> | null) => MaybePromise<void>;
};

type ResourceIdentifierCollectorFunction = (
  parameter: Readonly<{
    typename: string;
    id: string;
  }>,
  path: Array<string | number> | null
) => void;
type AddResourceIdentifierFunction = (
  values: string | Iterable<string> | None
) => void;

const ORIGINAL_CONTEXT_SYMBOL = Symbol("ORIGINAL_CONTEXT");

const getNodeInterfaceType = (schema: GraphQLSchema): GraphQLInterfaceType => {
  const maybeNodeInterface = schema.getType("Node");

  if (isNone(maybeNodeInterface)) {
    throw new Error(
      "The provided schema is not compatible with the relay mode as no type named 'Node' is in the GraphQL schema."
    );
  }
  if (isInterfaceType(maybeNodeInterface)) {
    return maybeNodeInterface;
  }

  throw new Error(
    "The provided schema is not compatible with the relay mode as the type 'Node' is not an interface type."
  );
};

const addResourceIdentifierCollectorToSchema = (
  schema: GraphQLSchema,
  isRelayMode: boolean
): GraphQLSchema => {
  const nodeInterfaceType = isRelayMode ? getNodeInterfaceType(schema) : null;

  return wrapSchema({
    schema,
    transforms: [
      new TransformObjectFields((typename, fieldName, fieldConfig) => {
        let isIDField =
          fieldName === "id" && isNonNullIDScalarType(fieldConfig.type);

        let resolve = fieldConfig.resolve!;
        const isNodeInterfaceCompatibleField =
          isSome(nodeInterfaceType) &&
          (schema.getType(typename) as GraphQLObjectType)
            .getInterfaces()
            .includes(nodeInterfaceType);

        fieldConfig.resolve = (src, args, context, info) => {
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

          const resourcePath = isNodeInterfaceCompatibleField
            ? pathToArray(info.path.prev!)
            : null;

          if (isIDField) {
            runWith(result, (id: string) =>
              collectResourceIdentifier({ typename, id }, resourcePath)
            );
          }
          return result;
        };

        return fieldConfig;
      }),
    ],
  });
};

export type BuildResourceIdentifierFunction = (
  parameter: Readonly<{
    typename: string;
    id: string;
  }>
) => string;

export const defaultResourceIdentifierNormalizer: BuildResourceIdentifierFunction = (
  params
) => `${params.typename}:${params.id}`;

export const defaultRelayResourceIdentifierNormalizer: BuildResourceIdentifierFunction = (
  params
) => params.id;

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
  /**
   * Whether the live query engine should run in node interface mode. Running in node interface mode requires that the schema has a `Query.node` field and uses global unique identifiers.
   * Running in this mode allows certain optimizations such as re-executing only smaller parts of a live query operation.
   */
  experimental_isNodeInterfaceMode?: boolean;
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

export class InMemoryLiveQueryStore {
  private _resourceTracker = new ResourceTracker<StoreRecord>();
  private _cacheCache = new WeakMap<GraphQLSchema, GraphQLSchema>();
  private _buildResourceIdentifier: BuildResourceIdentifierFunction;
  private _execute: typeof defaultExecute;
  private _includeIdentifierExtension = false;
  private _isNodeInterfaceMode: boolean;

  constructor(params?: InMemoryLiveQueryStoreParameter) {
    this._buildResourceIdentifier =
      params?.buildResourceIdentifier ??
      params?.experimental_isNodeInterfaceMode === true
        ? defaultRelayResourceIdentifierNormalizer
        : defaultResourceIdentifierNormalizer;

    this._execute = params?.execute ?? defaultExecute;
    this._includeIdentifierExtension =
      params?.includeIdentifierExtension ??
      (typeof process === "undefined"
        ? false
        : process?.env?.NODE_ENV === "development");
    this._isNodeInterfaceMode =
      params?.experimental_isNodeInterfaceMode ?? false;
  }

  private _getPatchedSchema(inputSchema: GraphQLSchema): GraphQLSchema {
    let schema = this._cacheCache.get(inputSchema);
    if (isNone(schema)) {
      schema = addResourceIdentifierCollectorToSchema(
        inputSchema,
        this._isNodeInterfaceMode
      );
      this._cacheCache.set(inputSchema, schema);
    }
    return schema;
  }

  /**
   * Prepare a schema for live query execution. The input schema will not be modified. The prepared schema is available until the `inputSchema` is garbage collected.
   * This is handy if you wanna do the heavy lifting at server start-up and not once the initial request is hitting the server.
   */
  prepareSchema(inputSchema: GraphQLSchema): void {
    this._getPatchedSchema(inputSchema);
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

    const operationNode = getOperationAST(document, operationName);

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
      isNone(operationNode) ||
      isLiveQueryOperationDefinitionNode(operationNode) === false
    ) {
      return fallbackToDefaultExecute();
    }

    const rootFieldIdentifier = Array.from(
      extractLiveQueryRootFieldCoordinates(
        document,
        operationNode,
        variableValues
      )
    );

    const schema = this._getPatchedSchema(inputSchema);
    const nodeRefetchDocuments = this._isNodeInterfaceMode
      ? buildNodeInterfaceRefetchQueryDocuments(
          inputSchema,
          document,
          operationName ?? undefined
        )
      : null;

    const {
      asyncIterableIterator: iterator,
      pushValue,
    } = makePushPullAsyncIterableIterator<LiveExecutionResult>();

    // keep track that current execution is the latest in order to prevent race-conditions :)
    let executionCounter = 0;
    let previousIdentifier = new Set<string>(rootFieldIdentifier);

    type ResourcePathRecord = {
      refetchKey: string;
      resourcePath: Array<string | number>;
    };
    let resourcePathsMap = new Map<string, Array<ResourcePathRecord>>();

    const record: StoreRecord = {
      iterator,
      pushValue,
      run: async (identifiers) => {
        // experimental node interface mode
        // if it is enabled and all identifiers that got invalidated are looked up in our node interface refetch map
        // if there is a strategy for each of those documents it is possible to re-execute each of those instead of the full initial live operation document.
        let allIdentifiersDidHitNodeInterfaceDocuments = false;
        if (isSome(identifiers) && isSome(nodeRefetchDocuments)) {
          for (const identifier of identifiers) {
            let identifierDidHit = false;
            allIdentifiersDidHitNodeInterfaceDocuments = true;

            const records = resourcePathsMap.get(identifier);
            if (isSome(records)) {
              for (const record of records) {
                const document = nodeRefetchDocuments.get(record.refetchKey)!;
                // TODO: how should we handle race conditions in general?
                // should every .run() call be chained?
                // how do we recover in case of an error?
                const result = (await this._execute({
                  schema,
                  document,
                  // we use the refetch document operationName
                  // operationName,
                  rootValue,
                  contextValue,
                  variableValues: {
                    id: identifier,
                  },
                })) as ExecutionResult;
                pushValue({
                  data: result.data!.node,
                  errors: result.errors,
                  path: record.resourcePath.slice(),
                  isLive: true,
                });
              }
              identifierDidHit = true;
            }

            if (identifierDidHit === false) {
              allIdentifiersDidHitNodeInterfaceDocuments = false;
              break;
            }
          }
        }

        if (allIdentifiersDidHitNodeInterfaceDocuments === true) {
          return;
        }

        resourcePathsMap = new Map();

        executionCounter = executionCounter + 1;
        const counter = executionCounter;
        const newIdentifier = new Set(rootFieldIdentifier);

        const collectResourceIdentifier: ResourceIdentifierCollectorFunction = (
          parameter,
          resourcePath: Array<string | number> | null
        ) => {
          const identifier = this._buildResourceIdentifier(parameter);
          newIdentifier.add(identifier);
          if (isSome(nodeRefetchDocuments) && isSome(resourcePath)) {
            // If we have a resourcePath it provides can be used for getting a document from relayRefetchDocuments
            // e.g. `relayRefetchDocuments.get(identifier)`
            // with which we can re-execute a query for the data at this resourcePath.
            const record = {
              refetchKey: resourcePath
                .filter((value) => typeof value === "string")
                .join("."),
              resourcePath,
            };
            let records = resourcePathsMap.get(identifier);
            if (isNone(records)) {
              records = [];
              resourcePathsMap.set(identifier, records);
            }
            records.push(record);
          }
        };

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

        const result = this._execute({
          schema,
          document,
          operationName,
          rootValue,
          contextValue: {
            [ORIGINAL_CONTEXT_SYMBOL]: contextValue,
            collectResourceIdentifier,
            addResourceIdentifier,
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
          // TODO: figure out whether there is a better way for doing this.
          nextTick(() => {
            record.iterator?.return?.();
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
              liveResult.extensions.liveResourceIdentifier = Array.from(
                newIdentifier
              );
            }
            record.pushValue(liveResult);
          }
        });
      },
    };

    this._resourceTracker.register(record, previousIdentifier);
    // Execute initial query
    record.run(null);

    // TODO: figure out how we can do this stuff without monkey-patching the iterator
    // We know that the iterator has a return property, so it is safe to cast it.
    const originalReturn = iterator.return!;
    iterator.return = () => {
      this._resourceTracker.release(record, previousIdentifier);
      return originalReturn();
    };

    return iterator;
  };

  /**
   * Invalidate queries (and schedule their re-execution) via a resource identifier.
   * @param identifiers A single or list of resource identifiers that should be invalidated.
   */
  async invalidate(identifiers: Array<string> | string) {
    if (typeof identifiers === "string") {
      identifiers = [identifiers];
    }

    const records = this._resourceTracker.getRecordsForIdentifiers(identifiers);

    for (const [record, identifiers] of records) {
      record.run(identifiers);
    }
  }
}
