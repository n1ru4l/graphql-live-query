import {
  ApolloLink,
  Operation,
  FetchResult,
  Observable,
  ApolloClient,
  InMemoryCache,
  gql,
} from "@apollo/client/core";
import { split } from "@apollo/client/link/core";
import { HttpLink } from "@apollo/client/link/http";
import { isLiveQueryOperationDefinitionNode } from "@n1ru4l/graphql-live-query";
import { print, getOperationAST } from "graphql";

type SSELinkOptions = EventSourceInit & { uri: string };

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

    return new Observable((sink) => {
      const eventsource = new EventSource(url.toString(), this.options);
      eventsource.onmessage = function (event) {
        const data = JSON.parse(event.data);
        sink.next(data);
        if (eventsource.readyState === 2) {
          sink.complete();
        }
      };
      eventsource.onerror = function (error) {
        sink.error(error);
      };
      return () => eventsource.close();
    });
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
