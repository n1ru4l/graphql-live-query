import type { SocketIOGraphQLClient } from "@n1ru4l/socket-io-graphql-client";
import { inflateGraphQLExecutionResult } from "@n1ru4l/graphql-result-normalizer";

import { applyPatch } from "fast-json-patch";

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

export const applyTransportNormalizerTrait = (
  client: SocketIOGraphQLClient
): SocketIOGraphQLClient => {
  const originalExecuteProperty: typeof client.execute = client.execute.bind(
    client
  );
  const newExecuteProperty: typeof client.execute = (opts) => {
    const observable = originalExecuteProperty(opts);

    return {
      subscribe: (
        sinkOrNext: Sink<any>["next"] | Sink<any>,
        ...args: [Sink<any>["error"], Sink<any>["complete"]]
      ) => {
        const sink: Sink<any> =
          typeof sinkOrNext === "function"
            ? { next: sinkOrNext, error: args[0], complete: args[1] }
            : sinkOrNext;

        let currentState: any = null;

        return observable.subscribe({
          next: (data) => {
            if (typeof data === "object" && data !== null && "__type" in data) {
              if (data.__type === "initial") {
                currentState = data.data;
                sink.next({
                  ...data,
                  ...inflateGraphQLExecutionResult(currentState),
                });
              } else if (data.__type === "patch") {
                if (currentState === null) {
                  console.error(
                    "SocketIOGraphQLClient (patch): Received patch before initial state."
                  );
                  return;
                }
                currentState = applyPatch(currentState, data.patch).newDocument;
                sink.next({
                  ...data,
                  ...inflateGraphQLExecutionResult(currentState),
                });
              }
            } else {
              sink.next(data);
            }
          },
          error: (...args) => {
            sink.error(...args);
          },
          complete: (...args) => {
            sink.complete(...args);
          },
        });
      },
    } as Observable<any>;
  };

  client.execute = newExecuteProperty;

  return client;
};
