import {
  Client,
  subscriptionExchange,
  fetchExchange,
  cacheExchange,
  dedupExchange,
} from "urql";
import { getOperationAST } from "@graphql-tools/graphql";
import { isLiveQueryOperationDefinitionNode } from "@n1ru4l/graphql-live-query";
import { Repeater } from "@repeaterjs/repeater";
import { ExecutionLivePatchResult } from "@n1ru4l/graphql-live-query-patch";
import { applyLiveQueryJSONDiffPatch } from "@n1ru4l/graphql-live-query-patch-jsondiffpatch";
import { applyAsyncIterableIteratorToSink } from "@n1ru4l/push-pull-async-iterable-iterator";

function makeEventStreamSource(url: string) {
  return new Repeater<ExecutionLivePatchResult>(async (push, end) => {
    const eventsource = new EventSource(url);
    eventsource.onmessage = function (event) {
      const data = JSON.parse(event.data);
      push(data);
      if (eventsource.readyState === 2) {
        end();
      }
    };
    eventsource.onerror = function (error) {
      end(error);
    };
    await end;
    eventsource.close();
  });
}

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
          const targetUrl = new URL(url);
          targetUrl.searchParams.append("query", operation.query);
          if (operation.variables) {
            targetUrl.searchParams.append(
              "variables",
              JSON.stringify(operation.variables)
            );
          }

          return {
            subscribe: (sink) => ({
              unsubscribe: applyAsyncIterableIteratorToSink(
                applyLiveQueryJSONDiffPatch(
                  makeEventStreamSource(targetUrl.toString())
                ),
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
