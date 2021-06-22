import { SocketIOGraphQLClient } from "@n1ru4l/socket-io-graphql-client";
import { applyAsyncIterableIteratorToSink } from "@n1ru4l/push-pull-async-iterable-iterator";
import { applyLiveQueryJSONPatch } from "@n1ru4l/graphql-live-query-patch-json-patch";
import {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  Operation,
  Observable,
  FetchResult,
} from "@apollo/client";
import { print } from "graphql";

class SocketIOGraphQLApolloLink extends ApolloLink {
  private networkLayer: SocketIOGraphQLClient<FetchResult>;
  constructor(networkLayer: SocketIOGraphQLClient<FetchResult>) {
    super();
    this.networkLayer = networkLayer;
  }

  public request(operation: Operation): Observable<FetchResult> | null {
    return new Observable<FetchResult>((sink) =>
      applyAsyncIterableIteratorToSink(
        applyLiveQueryJSONPatch(
          this.networkLayer.execute({
            operationName: operation.operationName,
            operation: print(operation.query),
            variables: operation.variables,
          })
        ),
        sink
      )
    );
  }
}

export const createApolloClient = (
  networkInterface: SocketIOGraphQLClient<FetchResult>
) =>
  new ApolloClient({
    link: new SocketIOGraphQLApolloLink(networkInterface),
    cache: new InMemoryCache(),
  });
