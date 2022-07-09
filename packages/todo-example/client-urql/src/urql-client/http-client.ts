import {
  Client,
  subscriptionExchange,
  fetchExchange,
  cacheExchange,
  dedupExchange,
} from "urql";
import { getOperationAST } from "graphql";
import { isLiveQueryOperationDefinitionNode } from "@n1ru4l/graphql-live-query";
import { Repeater } from "@repeaterjs/repeater";
import { applyLiveQueryJSONPatch } from "@n1ru4l/graphql-live-query-patch-json-patch";
import { applyAsyncIterableIteratorToSink } from "@n1ru4l/push-pull-async-iterable-iterator";
import { ExecutionLivePatchResult } from "@n1ru4l/graphql-live-query-patch";

export const createUrqlClient = (url: string) => {
  return new Client({
    url,
    exchanges: [
      cacheExchange,
      dedupExchange,
      subscriptionExchange({
        isSubscriptionOperation: ({ query, variables }) => {
          const definition = getOperationAST(query);
          const isSubscription =
            definition?.kind === "OperationDefinition" &&
            definition.operation === "subscription";

          const isLiveQuery =
            !!definition &&
            isLiveQueryOperationDefinitionNode(definition, variables);

          return isSubscription || isLiveQuery;
        },
        forwardSubscription(operation) {
          const create = () =>
            new Repeater<ExecutionLivePatchResult>((push, stop) => {
              const targetUrl = new URL(url);
              targetUrl.searchParams.append("query", operation.query);
              if (operation.variables) {
                targetUrl.searchParams.append(
                  "variables",
                  JSON.stringify(operation.variables)
                );
              }
              const eventsource = new EventSource(targetUrl.toString(), {
                withCredentials: true, // This is required for cookies
              });

              eventsource.onmessage = function (event) {
                const data = JSON.parse(event.data);
                push(data);
                if (eventsource.readyState === 2) {
                  stop();
                }
              };
              eventsource.onerror = function (error) {
                stop(error);
              };

              stop.then(() => {
                eventsource.close();
              });
            });

          return {
            subscribe: (sink) => ({
              unsubscribe: applyAsyncIterableIteratorToSink(
                applyLiveQueryJSONPatch(create()),
                sink
              ),
            }),
          };
        },
        enableAllOperations: true,
      }),
      fetchExchange,
    ],
  });
};
