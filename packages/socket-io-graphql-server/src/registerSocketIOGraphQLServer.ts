import * as graphql from "graphql";
import { isAsyncIterable } from "./isAsyncIterable";
import { LiveQueryStore, extractLiveQueries } from "@n1ru4l/graphql-live-query";

export type ErrorHandler = (error: graphql.GraphQLError) => void;

export const defaultErrorHandler: ErrorHandler = console.error;

export type PromiseOrPlain<T> = T | Promise<T>;

export type GetExecutionParameterFunctionParameter = {
  socket: SocketIO.Socket;
  graphQLPayload: {
    source: string;
    variableValues: { [key: string]: any } | null;
    operationName: string | null;
  };
};

export type GetExecutionParameterFunction = (
  parameter: GetExecutionParameterFunctionParameter
) => PromiseOrPlain<{
  graphQLExecutionParameter: {
    schema: graphql.GraphQLSchema;
    contextValue?: unknown;
    rootValue?: unknown;
    // These will be overwritten if provided; Useful for persisted queries etc.
    operationName?: string;
    source?: string;
    variableValues?: { [key: string]: any } | null;
  };
  liveQueryStore?: LiveQueryStore;
  onError?: ErrorHandler;
}>;

const isSome = <T>(input: T): input is Exclude<T, null | undefined> =>
  input != null;

const isSubscriptionOperation = (ast: graphql.DocumentNode) =>
  !!ast.definitions.find(
    (def) =>
      def.kind === "OperationDefinition" && def.operation === "subscription"
  );

export const registerSocketIOGraphQLServer = (
  socketServer: SocketIO.Server,
  getExecutionParameter: GetExecutionParameterFunction
) => {
  socketServer.on("connection", (socket) => {
    const subscriptions = new Map<number, () => void>();

    socket.on("@graphql/execute", async (message) => {
      // TODO: Better validation
      const id: number = message.id;
      const source: string = message.operation;
      const variableValues: { [key: string]: any } | null =
        message.variables ?? null;
      const operationName: string | null = message.operationName ?? null;

      const {
        graphQLExecutionParameter,
        liveQueryStore = null,
        onError = defaultErrorHandler,
      } = await getExecutionParameter({
        socket,
        graphQLPayload: {
          source,
          variableValues,
          operationName,
        },
      });

      const executionParameter = {
        operationName,
        source,
        variableValues,
        ...graphQLExecutionParameter,
      };

      const documentAst = graphql.parse(source);

      if (isSubscriptionOperation(documentAst)) {
        graphql
          .subscribe({
            ...executionParameter,
            document: documentAst,
          })
          .then((result) => {
            if (isAsyncIterable(result)) {
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
              socket.emit("@graphql/result", { id, isFinal: true, ...result });
            }
          });
        return;
      }

      const executeOperation = () => graphql.graphql(executionParameter);

      if (isSome(liveQueryStore)) {
        const liveQueries = extractLiveQueries(documentAst);

        if (liveQueries.length > 1) {
          throw new Error(
            "Document is allowed to only contain one live query."
          );
        } else if (liveQueries.length === 1) {
          const [liveQuery] = liveQueries;
          const unsubscribe = liveQueryStore.register(
            liveQuery,
            executeOperation,
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

      executeOperation().then((result) => {
        result.errors?.forEach((error) => {
          onError(error);
        });
        socket.emit("@graphql/result", { id, isFinal: true, ...result });
      });
    });

    socket.on("@graphql/unsubscribe", (message) => {
      const id = message.id;
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
