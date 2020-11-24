import type { Socket as IOSocket } from "socket.io-client";
import { PushPullAsyncIterableIterator } from "@n1ru4l/push-pull-async-iterable-iterator";

export type ExecutionParameter = {
  operation: string;
  operationName?: string | null;
  variables?: { [key: string]: any };
};

export type SocketIOGraphQLClient<TExecutionResult = unknown> = {
  execute: (
    opts: ExecutionParameter
  ) => AsyncIterableIterator<TExecutionResult>;
  destroy: () => void;
};

type OperationRecord<TExecutionResult = unknown> = {
  iterator: PushPullAsyncIterableIterator<TExecutionResult>;
  execute: () => void;
};

export const createSocketIOGraphQLClient = <TExecutionResult = unknown>(
  socket: IOSocket
): SocketIOGraphQLClient<TExecutionResult> => {
  let currentOperationId = 0;
  const operations = new Map<number, OperationRecord<TExecutionResult>>();
  const onExecutionResult = ({ id, isFinal, ...result }: any) => {
    const record = operations.get(id);
    if (!record) {
      return;
    }
    record.iterator.push(result);

    if (isFinal) {
      record.iterator.return?.();
      operations.delete(id);
    }
  };

  let isOffline = false;

  const onDisconnect = () => {
    isOffline = true;
  };
  const onConnect = () => {
    if (isOffline) {
      isOffline = false;
      Array.from(operations.values()).forEach((record) => {
        record.execute();
      });
    }
  };

  socket.on("@graphql/result", onExecutionResult);
  socket.on("connect", onConnect);
  socket.on("disconnect", onDisconnect);

  const destroy = () => {
    socket.off("@graphql/result", onExecutionResult);
    socket.off("connect", onConnect);
    socket.off("disconnect", onDisconnect);
  };

  const execute = ({
    operation,
    variables,
    operationName,
  }: ExecutionParameter): AsyncIterableIterator<TExecutionResult> => {
    const operationId = currentOperationId;
    currentOperationId = currentOperationId + 1;
    const iterator = new PushPullAsyncIterableIterator<TExecutionResult>();

    const record: OperationRecord<TExecutionResult> = {
      execute: () => {
        socket.emit("@graphql/execute", {
          id: operationId,
          operationName,
          operation,
          variables,
        });
      },
      iterator,
    };

    operations.set(operationId, record);
    record.execute();

    const returnIterator: AsyncIterableIterator<TExecutionResult> = {
      [Symbol.asyncIterator]: () => iterator,
      next: () => iterator.next(),
      return: () => {
        operations.delete(operationId);
        socket.emit("@graphql/unsubscribe", {
          id: operationId,
        });
        return iterator.return?.();
      },
    };

    return returnIterator;
  };

  return {
    execute,
    destroy,
  };
};
