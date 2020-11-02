type DisposeFunction = () => void;

export type Sink<TValue = unknown, TError = unknown> = {
  next: (value: TValue) => void;
  error: (error: TError) => void;
  complete: () => void;
};

export type ExecutionParameter = {
  operation: string;
  operationName?: string | null;
  variables?: { [key: string]: any };
};

export type SocketIOGraphQLClient<
  TExecutionResult = unknown,
  TError = unknown
> = {
  execute: (
    opts: ExecutionParameter,
    sink: Sink<TExecutionResult, TError>
  ) => DisposeFunction;
  destroy: () => void;
};

type OperationRecord<TExecutionResult = unknown, TError = unknown> = {
  sink: Sink<TExecutionResult, TError>;
  execute: () => void;
};

export const createSocketIOGraphQLClient = <
  TExecutionResult = unknown,
  TError = unknown
>(
  socket: SocketIOClient.Socket
): SocketIOGraphQLClient<TExecutionResult, TError> => {
  let currentOperationId = 0;
  const operations = new Map<
    number,
    OperationRecord<TExecutionResult, TError>
  >();
  const onExecutionResult = ({ id, isFinal, ...result }: any) => {
    const record = operations.get(id);
    if (!record) {
      return;
    }
    record.sink.next(result);

    if (isFinal) {
      record.sink.complete();
      operations.delete(id);
    }
  };

  const onReconnect = () => {
    Array.from(operations.values()).forEach((record) => {
      record.execute();
    });
  };

  socket.on("@graphql/result", onExecutionResult);
  socket.on("reconnect", onReconnect);

  const destroy = () => {
    socket.off("@graphql/result", onExecutionResult);
    socket.off("reconnect", onReconnect);
  };

  const execute = (
    { operation, variables, operationName }: ExecutionParameter,
    sink: Sink<TExecutionResult, TError>
  ) => {
    const operationId = currentOperationId;
    currentOperationId = currentOperationId + 1;

    const record: OperationRecord<TExecutionResult, TError> = {
      execute: () => {
        socket.emit("@graphql/execute", {
          id: operationId,
          operationName,
          operation,
          variables,
        });
      },
      sink,
    };

    operations.set(operationId, record);
    record.execute();

    return () => {
      operations.delete(operationId);
      socket.emit("@graphql/unsubscribe", {
        id: operationId,
      });
    };
  };

  return {
    execute,
    destroy,
  };
};
