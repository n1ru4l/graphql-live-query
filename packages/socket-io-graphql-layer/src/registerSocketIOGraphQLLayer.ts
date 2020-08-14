import * as graphql from "graphql";
import * as ia from "iterall";
import {
  LiveQueryStore,
  extractLiveQueries,
} from "@n1ru4l/graphql-live-queries";

const isSubscription = (ast: graphql.DocumentNode) =>
  !!ast.definitions.find(
    (def) =>
      def.kind === "OperationDefinition" && def.operation === "subscription"
  );

export type ErrorHandler = (error: graphql.GraphQLError) => void;

export const defaultErrorHandler: ErrorHandler = console.error;

export type PromiseOrPlain<T> = T | Promise<T>;

export type GetRootFunctionParameter = {
  document: graphql.DocumentNode;
};

export type GetRootFunction = (
  params: GetRootFunctionParameter
) => PromiseOrPlain<unknown>;

export type GetContextFunctionParameter = {
  document: graphql.DocumentNode;
};

export type GetContextFunction = (
  params: GetContextFunctionParameter
) => PromiseOrPlain<unknown>;

export const registerSocketIOGraphQLLayer = (d: {
  socketServer: SocketIO.Server;
  schema: graphql.GraphQLSchema;
  liveQueryStore?: LiveQueryStore;
  getContext?: GetContextFunction;
  getRoot?: GetRootFunction;
  onError?: (error: graphql.GraphQLError) => void;
}) => {
  const onError = d.onError ?? defaultErrorHandler;
  const liveQueryStore = d.liveQueryStore ?? null;

  d.socketServer.on("connection", (socket) => {
    const subscriptions = new Map<string, () => void>();

    socket.on("@graphql/execute", async (message) => {
      const id = message.id;
      const source = message.operation;
      const variableValues = message.variables;
      const operationName = message.operationName;
      const documentAst = graphql.parse(source);

      const contextValue = await d.getContext?.({ document: documentAst });
      const rootValue = await d.getRoot?.({ document: documentAst });

      const execOptions = {
        schema: d.schema,
        rootValue,
        contextValue,
        operationName,
        source,
        variableValues,
      };

      if (isSubscription(documentAst)) {
        graphql
          .subscribe({
            ...execOptions,
            document: documentAst,
          })
          .then((result) => {
            if (ia.isAsyncIterable(result)) {
              subscriptions.set(id, () => result.return?.(null));
              const run = async () => {
                for await (const subscriptionResult of result) {
                  subscriptionResult.errors?.forEach((error) => {
                    onError(error);
                  });
                  socket.emit("@graphql/result", { id, ...subscriptionResult });
                }
              };
              run();
            } else {
              result.errors?.forEach((error) => {
                onError(error);
              });

              socket.emit("@graphql/result", { id, ...result });
            }
          });
      }

      const execQuery = () => graphql.graphql(execOptions);

      if (liveQueryStore !== null) {
        const liveQueries = extractLiveQueries(documentAst);

        if (liveQueries.length > 1) {
          throw new Error(
            "Document is allowed to only contain one live query."
          );
        } else if (liveQueries.length === 1) {
          const [liveQuery] = liveQueries;
          const unsubscribe = liveQueryStore.register(
            liveQuery,
            execQuery,
            (result: graphql.ExecutionResult) => {
              result.errors?.forEach((error) => {
                onError(error);
              });
              socket.emit("@graphql/result", { id, ...result });
            }
          );
          subscriptions.set(id, unsubscribe);
          return;
        }
      }

      execQuery().then((result) => {
        result.errors?.forEach((error) => {
          onError(error);
        });
        socket.emit("@graphql/result", { id, ...result });
      });
    });

    socket.on("@graphql/unsubscribe", (message) => {
      const id = String(message.id);
      const subscription = subscriptions.get(id);
      subscription?.();
      subscriptions.delete(id);
    });

    socket.once("disconnect", () => {
      // Unsubscribe all pending GraphQL Live Queries and Subscriptions
      subscriptions.forEach((unsubscribe) => unsubscribe());
    });
  });
};
