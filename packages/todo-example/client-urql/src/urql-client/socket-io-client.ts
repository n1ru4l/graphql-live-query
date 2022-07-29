import {
  Client,
  subscriptionExchange,
  type ExecutionResult,
  cacheExchange,
  dedupExchange,
} from "urql";
import { io } from "socket.io-client";
import { createSocketIOGraphQLClient } from "@n1ru4l/socket-io-graphql-client";
import { applySourceToSink } from "./shared";

export const createUrqlClient = async () => {
  let host =
    new URLSearchParams(window.location.search).get("host") ?? undefined;
  const socket = host ? io(host) : io();

  const networkInterface = createSocketIOGraphQLClient<ExecutionResult>(socket);

  return new Client({
    url: "noop",
    exchanges: [
      cacheExchange,
      dedupExchange,
      subscriptionExchange({
        forwardSubscription: (operation) => ({
          subscribe: (sink) => ({
            unsubscribe: applySourceToSink(
              networkInterface.execute({
                operation: operation.query,
                variables: operation.variables,
              }),
              sink
            ),
          }),
        }),
        enableAllOperations: true,
      }),
    ],
  });
};
