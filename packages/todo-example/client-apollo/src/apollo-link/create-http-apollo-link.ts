import {
  ApolloLink,
  Operation,
  FetchResult,
  Observable,
} from "@apollo/client/core";
import { split } from "@apollo/client/link/core";
import { HttpLink } from "@apollo/client/link/http";
import { isLiveQueryOperationDefinitionNode } from "@n1ru4l/graphql-live-query";
import { Repeater } from "@repeaterjs/repeater";
import { print, getOperationAST } from "graphql";
import { applyLiveQueryJSONDiffPatch } from "@n1ru4l/graphql-live-query-patch-jsondiffpatch";
import { applyAsyncIterableIteratorToSink } from "@n1ru4l/push-pull-async-iterable-iterator";

type SSELinkOptions = EventSourceInit & { uri: string };

function makeEventStreamSource(url: string, options: SSELinkOptions) {
  return new Repeater<FetchResult>(async (push, end) => {
    const eventsource = new EventSource(url, options);
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

class SSELink extends ApolloLink {
  constructor(private options: SSELinkOptions) {
    super();
  }

  public request(operation: Operation): Observable<FetchResult> {
    const url = new URL(this.options.uri);
    url.searchParams.append("query", print(operation.query));
    url.searchParams.append(
      "extensions",
      JSON.stringify(operation.operationName)
    );
    url.searchParams.append("variables", JSON.stringify(operation.variables));
    if (operation.extensions) {
      url.searchParams.append(
        "extensions",
        JSON.stringify(operation.extensions)
      );
    }

    return new Observable((sink) =>
      applyAsyncIterableIteratorToSink(
        applyLiveQueryJSONDiffPatch(
          makeEventStreamSource(url.toString(), this.options)
        ),
        sink
      )
    );
  }
}

export const createHTTPApolloLink = (uri: string) => {
  const sseLink = new SSELink({
    uri,
  });

  const httpLink = new HttpLink({
    uri,
  });

  const link = split(
    ({ query, operationName, variables }) => {
      const definition = getOperationAST(query, operationName);
      const isSubscription =
        definition?.kind === "OperationDefinition" &&
        definition.operation === "subscription";

      const isLiveQuery =
        !!definition &&
        isLiveQueryOperationDefinitionNode(definition, variables);

      return isSubscription || isLiveQuery;
    },
    sseLink,
    httpLink
  );

  return link;
};
