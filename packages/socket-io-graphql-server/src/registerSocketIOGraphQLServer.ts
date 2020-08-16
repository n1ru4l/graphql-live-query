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

type MessagePayload = {
  id: number;
  operation: string;
  variables: { [key: string]: any } | null;
  operationName: string | null;
};

const decodeMessage = (message: unknown): MessagePayload | Error => {
  let id: number;
  let operation: string | null = null;
  let variables: { [key: string]: any } | null = null;
  let operationName: string | null = null;

  if (typeof message === "object" && message !== null) {
    const maybeId: unknown = (message as any).id;
    if (typeof maybeId === "number") {
      id = maybeId;
    } else {
      return new Error("Invalid message format. Field 'id' is invalid.");
    }
    const maybeOperation: unknown = (message as any).operation;
    if (typeof maybeOperation === "string") {
      operation = maybeOperation;
    } else {
      return new Error("Invalid message format. Field 'operation' is invalid.");
    }
    const maybeVariables: unknown = (message as any).variables;
    if (typeof maybeVariables === "object") {
      variables = maybeVariables;
    } else {
      return new Error(
        "Invalid message format. Field 'variableValues' is invalid."
      );
    }
    const maybeOperationName: unknown = (message as any).operationName ?? null;
    if (maybeOperationName === null || typeof maybeOperationName === "string") {
      operationName = maybeOperationName ?? null;
    } else {
      return new Error(
        "Invalid message format. Field 'operationName' is invalid."
      );
    }

    return {
      id,
      operation,
      variables,
      operationName,
    };
  }

  return new Error("Invalid message format. Sent message is not an object.");
};

export type DecodeErrorHandler = (error: Error) => void;

export type RegisterSocketIOGraphQLServerParameter = {
  socketServer: SocketIO.Server;
  getExecutionParameter: GetExecutionParameterFunction;
  onMessageDecodeError?: DecodeErrorHandler;
};

export const registerSocketIOGraphQLServer = ({
  socketServer,
  getExecutionParameter,
  onMessageDecodeError = console.error,
}: RegisterSocketIOGraphQLServerParameter) => {
  socketServer.on("connection", (socket) => {
    const subscriptions = new Map<number, () => void>();

    socket.on("@graphql/execute", async (rawMessage) => {
      const message = decodeMessage(rawMessage);

      if (message instanceof Error) {
        // TODO: Unify what we should do with this.
        onMessageDecodeError(message);
        return;
      }

      const {
        id,
        operation: source,
        variables: variableValues,
        operationName,
      } = message;

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
