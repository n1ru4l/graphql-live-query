import type { Socket as IOSocket } from "socket.io-client";
import { makePushPullAsyncIterableIterator } from "@n1ru4l/push-pull-async-iterable-iterator";

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
  iterator: AsyncIterableIterator<TExecutionResult>;
  publishValue: (value: TExecutionResult) => void;
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
    record.publishValue(result);

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
    const {
      asyncIterableIterator: iterator,
      pushValue: publishValue,
    } = makePushPullAsyncIterableIterator<TExecutionResult>();

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
      publishValue,
    };

    operations.set(operationId, record);
    record.execute();

    const originalReturn = iterator.return;
    iterator.return = () => {
      operations.delete(operationId);
      socket.emit("@graphql/unsubscribe", {
        id: operationId,
      });

      return originalReturn
        ? originalReturn()
        : Promise.resolve({ done: true, value: undefined });
    };

    return iterator;
  };

  return {
    execute,
    destroy,
  };
};
