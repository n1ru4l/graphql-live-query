import React from "react";
import ReactDOM from "react-dom";
import { io } from "socket.io-client";
import "todomvc-app-css/index.css";
import { ApolloProvider, FetchResult } from "@apollo/client";
import { createSocketIOGraphQLClient } from "@n1ru4l/socket-io-graphql-client";
import type { FetcherResult } from "graphiql";
import type { GraphiQLWidget as GraphiQLWidgetType } from "./GraphiQLWidget";

import { createApolloClient } from "./createApolloClient";
import { TodoApplication } from "./TodoApplication";

const socket = io();
const networkInterface = createSocketIOGraphQLClient<FetchResult>(socket);
const apolloClient = createApolloClient(networkInterface);

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
    <ApolloProvider client={apolloClient}>
      <TodoApplication />
      <GraphiQLWidget />
    </ApolloProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
