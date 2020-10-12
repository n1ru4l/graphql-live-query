import { SocketIOGraphQLClient } from "@n1ru4l/socket-io-graphql-client";
import {
  Client,
  dedupExchange,
  cacheExchange,
  subscriptionExchange,
} from "urql";

export const createUrqlClient = (networkInterface: SocketIOGraphQLClient) => {
  return new Client({
    url: "noop",
    exchanges: [
      dedupExchange,
      cacheExchange,
      subscriptionExchange({
        forwardSubscription: (operation) => {
          return networkInterface.execute({
            operation: operation.query,
            variables: operation.variables,
          });
        },
        enableAllOperations: true,
      }),
    ],
  });
};
