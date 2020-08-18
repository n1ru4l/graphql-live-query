import * as graphql from "graphql";
import { LiveQueryStore, extractLiveQueries } from "@n1ru4l/graphql-live-query";
import { isAsyncIterable } from "./isAsyncIterable";
import { isSome } from "./isSome";

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

const isSubscriptionOperation = (ast: graphql.DocumentNode) =>
  !!ast.definitions.find(
    def =>
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
      operationName
    };
  }

  return new Error("Invalid message format. Sent message is not an object.");
};

const decodeUnsubscribeMessage = (message: unknown): { id: number } | Error => {
  if (typeof message === "object" && message !== null) {
    const maybeId: unknown = (message as any).id;
    if (typeof maybeId === "number") {
      return { id: maybeId };
    } else {
      return new Error("Invalid message format. Field 'id' is invalid.");
    }
  }

  return new Error("Invalid message format. Sent message is not an object.");
};

export type DecodeErrorHandler = (error: Error) => void;

export type RegisterSocketIOGraphQLServerParameter = {
  socketServer: SocketIO.Server;
  getExecutionParameter: GetExecutionParameterFunction;
  /* error handler for failed message decoding attempts */
  onMessageDecodeError?: DecodeErrorHandler;
  /* whether the GraphQL layer has to be enabled for each socket explicitly */
  isLazy?: boolean;
};

export type UnsubscribeHandler = () => void;

export type SocketIOGraphQLServer = {
  /* register a single socket */
  registerSocket: (socket: SocketIO.Socket) => UnsubscribeHandler;
  /* dispose a single socket */
  disposeSocket: (socket: SocketIO.Socket) => void;
  /* dispose all connections and remove all listeners on the socketServer. */
  destroy: () => void;
};

export const registerSocketIOGraphQLServer = ({
  socketServer,
  getExecutionParameter,
  onMessageDecodeError = console.error,
  isLazy = false
}: RegisterSocketIOGraphQLServerParameter): SocketIOGraphQLServer => {
  let acceptNewConnections = true;
  const disposeHandlers = new Map<SocketIO.Socket, UnsubscribeHandler>();
  const registerSocket = (socket: SocketIO.Socket) => {
    // In case the socket is already registered :)
    const dispose = disposeHandlers.get(socket);
    if (dispose) {
      return dispose;
    }

    const subscriptions = new Map<number, () => void>();

    const executeHandler = async (rawMessage: unknown) => {
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
        operationName
      } = message;

      const {
        graphQLExecutionParameter,
        liveQueryStore = null,
        onError = defaultErrorHandler
      } = await getExecutionParameter({
        socket,
        graphQLPayload: {
          source,
          variableValues,
          operationName
        }
      });

      const executionParameter = {
        operationName,
        source,
        variableValues,
        ...graphQLExecutionParameter
      };

      const documentAst = graphql.parse(source);

      if (isSubscriptionOperation(documentAst)) {
        graphql
          .subscribe({
            ...executionParameter,
            document: documentAst
          })
          .then(result => {
            if (isAsyncIterable(result)) {
              subscriptions.set(id, () => result.return?.(null));
              const run = async () => {
                for await (const subscriptionResult of result) {
                  subscriptionResult.errors?.forEach(error => {
                    onError(error);
                  });
                  socket.emit("@graphql/result", { id, ...subscriptionResult });
                }
              };
              run();
            } else {
              result.errors?.forEach(error => {
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
              result.errors?.forEach(error => {
                onError(error);
              });
              socket.emit("@graphql/result", { id, ...result });
            }
          );
          subscriptions.set(id, unsubscribe);
          return;
        }
      }

      executeOperation().then(result => {
        result.errors?.forEach(error => {
          onError(error);
        });
        socket.emit("@graphql/result", { id, isFinal: true, ...result });
      });
    };

    socket.on("@graphql/execute", executeHandler);

    const unsubscribeHandler = (rawMessage: unknown) => {
      const message = decodeUnsubscribeMessage(rawMessage);
      if (message instanceof Error) {
        // TODO: Unify what we should do with this.
        onMessageDecodeError(message);
        return;
      }
      const id = message.id;
      const subscription = subscriptions.get(id);
      subscription?.();
      subscriptions.delete(id);
    };

    socket.on("@graphql/unsubscribe", unsubscribeHandler);

    const disconnectHandler = () => {
      // Unsubscribe all pending GraphQL Live Queries and Subscriptions
      subscriptions.forEach(unsubscribe => unsubscribe());
      disposeHandlers.delete(socket);
    };

    socket.once("disconnect", disconnectHandler);

    const disposeHandler = () => {
      socket.off("@graphql/execute", executeHandler);
      socket.off("@graphql/unsubscribe", unsubscribeHandler);
      socket.off("disconnect", disconnectHandler);
      disconnectHandler();
    };

    disposeHandlers.set(socket, disposeHandler);
    return disposeHandler;
  };

  if (isLazy === false && acceptNewConnections === true) {
    socketServer.on("connection", registerSocket);
  }

  return {
    registerSocket: (socket: SocketIO.Socket) =>
      disposeHandlers.get(socket) ?? registerSocket(socket),
    disposeSocket: (socket: SocketIO.Socket) => disposeHandlers.get(socket)?.(),
    destroy: () => {
      socketServer.off("connection", registerSocket);
      for (const dispose of disposeHandlers.values()) {
        dispose();
      }
    }
  };
};
