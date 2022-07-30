import {
  GraphQLResponse,
  Observable,
  RequestParameters,
  Variables,
} from "relay-runtime";
import { Repeater } from "@repeaterjs/repeater";
import { applyLiveQueryJSONDiffPatch } from "@n1ru4l/graphql-live-query-patch-jsondiffpatch";
import { applyAsyncIterableIteratorToSink } from "@n1ru4l/push-pull-async-iterable-iterator";

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

export function createHTTPFetcher(url: string) {
  return (
    request: RequestParameters,
    variables: Variables
  ): Observable<GraphQLResponse> => {
    if (!request.text) throw new Error("Missing document.");
    const { text: operation, operationKind } = request;

    return Observable.create<GraphQLResponse>((sink) => {
      /**
       * Note: this is a very naive check. Don't do this at home kids.
       */
      const isLiveQuery = operation.includes("@live");

      const isSSE = isLiveQuery || operationKind === "subscription";

      if (isSSE) {
        const targetUrl = new URL(url.toString());
        targetUrl.searchParams.append("query", operation);
        if (variables) {
          targetUrl.searchParams.append("variables", JSON.stringify(variables));
        }
        return applyAsyncIterableIteratorToSink(
          applyLiveQueryJSONDiffPatch(
            makeEventStreamSource(targetUrl.toString())
          ),
          sink
        );
      }

      fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          query: operation,
          variables,
          operationName: request.name,
        }),
      })
        .then((res) => res.json())
        .then((res) => {
          sink.next(res);
          sink.complete();
        })
        .catch((error) => {
          sink.error(error);
        });
    });
  };
}
