import { SocketIOGraphQLClient } from "@n1ru4l/socket-io-graphql-client";
import { ApolloClient, InMemoryCache, ApolloLink, Operation, Observable, FetchResult } from '@apollo/client';
import { print } from "graphql"


class SocketIOGraphQLApolloLink extends ApolloLink {
  private networkLayer: SocketIOGraphQLClient;
  constructor(networkLayer: SocketIOGraphQLClient) {
    super()
    this.networkLayer = networkLayer;
  }

  public request(operation: Operation): Observable<FetchResult> | null {
    const sink = this.networkLayer.execute({
      operationName: operation.operationName,
      operation: print(operation.query),
      variables: operation.variables
    });

    return sink as Observable<FetchResult>
  }
}

export const createApolloClient = (
  networkInterface: SocketIOGraphQLClient
) => {



  return new ApolloClient({
    link: new SocketIOGraphQLApolloLink(networkInterface),
    cache: new InMemoryCache()
  });
};
