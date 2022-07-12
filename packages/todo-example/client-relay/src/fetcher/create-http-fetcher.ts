import { applyLiveQueryJSONPatch } from "@n1ru4l/graphql-live-query-patch-json-patch";
import { applyAsyncIterableIteratorToSink } from "@n1ru4l/push-pull-async-iterable-iterator";
import {
  GraphQLResponse,
  Observable,
  RequestParameters,
  Variables,
} from "relay-runtime";
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
        const eventsource = new EventSource(targetUrl.toString());

        eventsource.onmessage = function (event) {
          const data = JSON.parse(event.data);
          sink.next(data);
          if (eventsource.readyState === 2) {
            sink.complete();
          }
        };
        eventsource.onerror = function (event) {
          console.log("Error", event);
          sink.error(new Error("Check the console bruv."));
        };
        return () => eventsource.close();
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
