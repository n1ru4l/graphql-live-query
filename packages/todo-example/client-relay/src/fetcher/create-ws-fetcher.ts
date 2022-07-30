import {
  GraphQLResponse,
  Observable,
  RequestParameters,
  Variables,
} from "relay-runtime";
import { createClient } from "graphql-ws";
import { applyLiveQueryJSONDiffPatch } from "@n1ru4l/graphql-live-query-patch-jsondiffpatch";
import {
  makeAsyncIterableIteratorFromSink,
  applyAsyncIterableIteratorToSink,
} from "@n1ru4l/push-pull-async-iterable-iterator";

export function createWSFetcher(url: string) {
  const client = createClient({ url });
  return (
    request: RequestParameters,
    variables: Variables
  ): Observable<GraphQLResponse> => {
    if (!request.text) throw new Error("Missing document.");
    const { text: operation, name } = request;

    return Observable.create<GraphQLResponse>((sink) => {
      const source = makeAsyncIterableIteratorFromSink<GraphQLResponse>(
        (sink) => {
          return client.subscribe<GraphQLResponse>(
            { variables, query: operation },
            {
              next: sink.next.bind(sink) as any,
              complete: sink.complete.bind(sink),
              error: sink.error.bind(sink),
            }
          );
        }
      );
      return applyAsyncIterableIteratorToSink(
        applyLiveQueryJSONDiffPatch(source),
        sink
      );
    });
  };
}
