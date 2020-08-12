import { parse } from "graphql";

type Sink<T> = {
  next: (value: T) => void;
  error: (error: any) => void;
  complete: () => void;
};

type Unsubscribable = {
  unsubscribe: () => void;
};

type Observable<T> = {
  subscribe(opts: {
    next: (value: T) => void;
    error: (error: any) => void;
    complete: () => void;
  }): Unsubscribable;
  subscribe(
    next: (value: T) => void,
    error: null | undefined,
    complete: () => void
  ): Unsubscribable;
};

type Parameter = {
  query: string;
  operationName: string;
  variables?: { [key: string]: any };
};

export type SocketIONetworkInterface = (opts: Parameter) => Observable<any>;

export const createSocketIOGraphQLNetworkInterface = (
  socket: SocketIOClient.Socket
): SocketIONetworkInterface => {
  let currentOperationId = 0;
  const responseHandlers = new Map();
  const subscriptionHandlers = new Map();

  socket.on("@graphql/result", ({ id, ...result }: any) => {
    const sink = responseHandlers.get(id);
    sink?.next(result);
  });

  socket.on("@graphql/update", ({ id, ...result }: any) => {
    const sink = subscriptionHandlers.get(id);
    sink?.next(result);
  });

  return ({ query: operation, variables }: Parameter) => {
    const operationId = currentOperationId;
    currentOperationId = currentOperationId + 1;

    return {
      subscribe: (
        sinkOrNext: Sink<any>["next"] | Sink<any>,
        ...args: [Sink<any>["error"], Sink<any>["complete"]]
      ) => {
        const sink: Sink<any> =
          typeof sinkOrNext === "function"
            ? { next: sinkOrNext, error: args[0], complete: args[1] }
            : sinkOrNext;

        const ast = parse(operation);

        const isLiveQuery = !!ast.definitions.find(
          (def) =>
            (def.kind === "OperationDefinition" &&
              def.directives?.find(
                (directive) => directive.name.value === "live"
              )) ??
            null
        );
        const isSubscription = !!ast.definitions.find(
          (def) =>
            def.kind === "OperationDefinition" &&
            def.operation === "subscription"
        );

        if (isSubscription) {
          socket.emit("@graphql/subscribe", {
            id: operationId,
            operation,
            variables,
          });

          subscriptionHandlers.set(operationId, sink);
          return {
            unsubscribe: () => {
              socket.emit("@graphql/unsubscribe", { id: operationId });
              subscriptionHandlers.delete(operationId);
            },
          };
        } else {
          responseHandlers.set(operationId, sink);
          socket.emit("@graphql/execute", {
            id: operationId,
            operation,
            variables,
          });

          return {
            unsubscribe: () => {
              responseHandlers.delete(operationId);
              if (isLiveQuery) {
                socket.emit("@graphql/unsubscribe-live", {
                  id: operationId,
                });
              }
            },
          };
        }
      },
    } as Observable<any>;
  };
};
