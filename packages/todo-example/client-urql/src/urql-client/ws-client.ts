import {
  Client,
  subscriptionExchange,
  fetchExchange,
  cacheExchange,
  dedupExchange,
  ExecutionResult,
} from "urql";
import { createClient } from "graphql-ws";
import { applySourceToSink } from "./shared";
import { makeAsyncIterableIteratorFromSink } from "@n1ru4l/push-pull-async-iterable-iterator";

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
              const source = makeAsyncIterableIteratorFromSink((sink) => {
                return client.subscribe<ExecutionResult>(
                  { ...operation, query: operation.query },
                  {
                    next: sink.next.bind(sink),
                    complete: sink.complete.bind(sink),
                    error: sink.error.bind(sink),
                  }
                );
              });

              return {
                unsubscribe: applySourceToSink(source, sink),
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
