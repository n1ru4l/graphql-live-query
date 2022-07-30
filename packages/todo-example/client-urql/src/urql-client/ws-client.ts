import {
  Client,
  subscriptionExchange,
  fetchExchange,
  cacheExchange,
  dedupExchange,
  ExecutionResult,
} from "urql";
import { createClient } from "graphql-ws";
import { applyLiveQueryJSONDiffPatch } from "@n1ru4l/graphql-live-query-patch-jsondiffpatch";
import {
  makeAsyncIterableIteratorFromSink,
  applyAsyncIterableIteratorToSink,
} from "@n1ru4l/push-pull-async-iterable-iterator";

export const createUrqlClient = (url: string) => {
  const client = createClient({ url });
  return new Client({
    url: "noop",
    exchanges: [
      cacheExchange,
      dedupExchange,
      subscriptionExchange({
        forwardSubscription(operation) {
          return {
            subscribe: (sink) => {
              const source = makeAsyncIterableIteratorFromSink<ExecutionResult>(
                (sink) => {
                  return client.subscribe<ExecutionResult>(
                    { ...operation, query: operation.query },
                    {
                      next: sink.next.bind(sink) as any,
                      complete: sink.complete.bind(sink),
                      error: sink.error.bind(sink),
                    }
                  );
                }
              );

              return {
                unsubscribe: applyAsyncIterableIteratorToSink(
                  applyLiveQueryJSONDiffPatch(source),
                  sink
                ),
              };
            },
          };
        },
        enableAllOperations: true,
      }),
      fetchExchange,
    ],
  });
};
