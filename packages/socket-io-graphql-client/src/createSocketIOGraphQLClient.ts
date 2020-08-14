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
  operation: string;
  operationName: string;
  variables?: { [key: string]: any };
};

export type SocketIOGraphQLClient = {
  execute: (opts: Parameter) => Observable<any>;
  destroy: () => void;
};

type OperationRecord = {
  sink: Sink<unknown>;
  execute: () => void;
};

export const createSocketIOGraphQLClient = (
  socket: SocketIOClient.Socket
): SocketIOGraphQLClient => {
  let currentOperationId = 0;
  const operations = new Map<number, OperationRecord>();

  const onExecutionResult = ({ id, isFinal, ...result }: any) => {
    const record = operations.get(id);
    if (!record) {
      return;
    }
    record.sink.next(result);

    // For non live queries we only get one result.
    if (isFinal) {
      record.sink.complete();
      operations.delete(id);
    }
  };

  const onReconnect = () => {
    for (const [, record] of operations) {
      record.execute();
    }
  };

  socket.on("@graphql/result", onExecutionResult);
  socket.on("reconnect", onReconnect);

  const destroy = () => {
    socket.off("@graphql/result", onExecutionResult);
    socket.off("reconnect", onReconnect);
  };

  const execute = ({ operation, variables }: Parameter) => {
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

        const record: OperationRecord = {
          execute: () => {
            socket.emit("@graphql/execute", {
              id: operationId,
              operation,
              variables,
            });
          },
          sink,
        };

        operations.set(operationId, record);
        record.execute();

        return {
          unsubscribe: () => {
            operations.delete(operationId);
            socket.emit("@graphql/unsubscribe", {
              id: operationId,
            });
          },
        };
      },
    } as Observable<any>;
  };

  return {
    execute,
    destroy,
  };
};
