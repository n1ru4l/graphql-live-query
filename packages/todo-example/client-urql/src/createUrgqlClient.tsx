import { SocketIOGraphQLClient } from "@n1ru4l/socket-io-graphql-client";
import { applyLiveQueryPatchInflator } from "@n1ru4l/graphql-live-query-patch";
import { applyAsyncIterableIteratorToSink } from "@n1ru4l/push-pull-async-iterable-iterator";
import {
  Client,
  dedupExchange,
  cacheExchange,
  subscriptionExchange,
  ExecutionResult,
} from "urql";

export const createUrqlClient = (
  networkInterface: SocketIOGraphQLClient<ExecutionResult>
) => {
  return new Client({
    url: "noop",
    exchanges: [
      dedupExchange,
      cacheExchange,
      subscriptionExchange({
        forwardSubscription: (operation) => ({
          subscribe: (sink) => ({
            unsubscribe: applyAsyncIterableIteratorToSink(
              applyLiveQueryPatchInflator(
                networkInterface.execute({
                  operation: operation.query,
                  variables: operation.variables,
                })
              ),
              sink
            ),
          }),
        }),
        enableAllOperations: true,
      }),
    ],
  });
};
