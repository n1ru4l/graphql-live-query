import React from "react";
import ReactDOM from "react-dom";
import "todomvc-app-css/index.css";
import { Provider, ExecutionResult } from "urql";
import { io } from "socket.io-client";
import { createSocketIOGraphQLClient } from "@n1ru4l/socket-io-graphql-client";
import type { FetcherResult } from "graphiql";
import type { GraphiQLWidget as GraphiQLWidgetType } from "./GraphiQLWidget";

import { createUrqlClient } from "./createUrgqlClient";
import { TodoApplication } from "./TodoApplication";

let host = new URLSearchParams(window.location.search).get("host") ?? undefined;
const socket = host ? io(host) : io();
const networkInterface = createSocketIOGraphQLClient<ExecutionResult>(socket);
const urqlClient = createUrqlClient(networkInterface);

// we only want GraphiQL in our development environment!
let GraphiQLWidget = (): React.ReactElement | null => null;
if (process.env.NODE_ENV === "development") {
  GraphiQLWidget = () => {
    const [Component, setComponent] = React.useState<
      typeof GraphiQLWidgetType | null
    >(null);

    React.useEffect(() => {
      import("./GraphiQLWidget").then(({ GraphiQLWidget }) => {
        setComponent(() => GraphiQLWidget);
      });
    }, []);

    return Component ? (
      <Component
        fetcher={({ query: operation, variables, operationName }) =>
          networkInterface.execute({
            operation,
            variables,
            operationName,
          }) as AsyncIterableIterator<FetcherResult>
        }
      />
    ) : null;
  };
}

ReactDOM.render(
  <React.StrictMode>
    <Provider value={urqlClient}>
      <TodoApplication />
      <GraphiQLWidget />
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
