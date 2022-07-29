import {
  createSocketIOGraphQLClient,
  SocketIOGraphQLClient,
} from "@n1ru4l/socket-io-graphql-client";
import { ApolloLink, Operation, Observable, FetchResult } from "@apollo/client";
import { print } from "graphql";
import { io } from "socket.io-client";
import { applySourceToSink } from "./shared";

class SocketIOGraphQLApolloLink extends ApolloLink {
  private networkLayer: SocketIOGraphQLClient<FetchResult>;
  constructor(networkLayer: SocketIOGraphQLClient<FetchResult>) {
    super();
    this.networkLayer = networkLayer;
  }

  public request(operation: Operation): Observable<FetchResult> | null {
    return new Observable<FetchResult>((sink) =>
      applySourceToSink(
        this.networkLayer.execute({
          operationName: operation.operationName,
          operation: print(operation.query),
          variables: operation.variables,
        }),
        sink
      )
    );
  }
}

export const createSocketIOApolloLink = () => {
  let host =
    new URLSearchParams(window.location.search).get("host") ?? undefined;
  const socket = host ? io(host) : io();
  const networkInterface = createSocketIOGraphQLClient<FetchResult>(socket);

  return new SocketIOGraphQLApolloLink(networkInterface);
};
