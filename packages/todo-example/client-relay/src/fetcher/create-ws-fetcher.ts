import {
  GraphQLResponse,
  Observable,
  RequestParameters,
  Variables,
} from "relay-runtime";
import { createClient } from "graphql-ws";
import { Repeater } from "@repeaterjs/repeater";
import { applySourceToSink } from "./shared";
import { makeAsyncIterableIteratorFromSink } from "@n1ru4l/push-pull-async-iterable-iterator";

function makeEventStreamSource(url: string) {
  return new Repeater<GraphQLResponse>(async (push, end) => {
    const eventsource = new EventSource(url);
    eventsource.onmessage = function (event) {
      const data = JSON.parse(event.data);
      push(data);
      if (eventsource.readyState === 2) {
        end();
      }
    };
    eventsource.onerror = function (event) {
      console.log("Error", event);
      end(new Error("Check the console bruv."));
    };
    await end;

    eventsource.close();
  });
}

export function createWSFetcher(url: string) {
  const client = createClient({ url });
  return (
    request: RequestParameters,
    variables: Variables
  ): Observable<GraphQLResponse> => {
    if (!request.text) throw new Error("Missing document.");
    const { text: operation, name } = request;

    return Observable.create<GraphQLResponse>((sink) => {
      const source = makeAsyncIterableIteratorFromSink((sink) => {
        return client.subscribe<GraphQLResponse>(
          { variables, query: operation },
          {
            next: sink.next.bind(sink),
            complete: sink.complete.bind(sink),
            error: sink.error.bind(sink),
          }
        );
      });

      return applySourceToSink(source, sink);
    });
  };
}
