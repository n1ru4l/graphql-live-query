import { createSocketIOGraphQLClient } from "@n1ru4l/socket-io-graphql-client";
import {
  GraphQLResponse,
  Observable,
  RequestParameters,
  Variables,
} from "relay-runtime";
import { io } from "socket.io-client";
import { applySourceToSink } from "./shared";

export function createSocketIOFetcher() {
  let host =
    new URLSearchParams(window.location.search).get("host") ?? undefined;
  const socket = host ? io(host) : io();
  const networkInterface = createSocketIOGraphQLClient<GraphQLResponse>(socket);

  return (
    request: RequestParameters,
    variables: Variables
  ): Observable<GraphQLResponse> => {
    if (!request.text) throw new Error("Missing document.");
    const { text: operation, name } = request;
    return Observable.create<GraphQLResponse>((sink) =>
      applySourceToSink(
        networkInterface.execute({
          operation,
          variables,
          operationName: name,
        }),
        sink
      )
    );
  };
}
