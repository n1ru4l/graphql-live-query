import * as React from "react";
import * as ReactDOM from "react-dom";
import { createSocketIOGraphQLClient } from "@n1ru4l/socket-io-graphql-client";
import { GraphQLResponse } from "relay-runtime";
import type { FetcherResult } from "graphiql/dist/components/GraphiQL";
import "todomvc-app-css/index.css";
import { io } from "socket.io-client";
import { TodoApplication } from "./TodoApplication";
import type { GraphiQLWidget as GraphiQLWidgetType } from "./GraphiQLWidget";
import { createRelayEnvironment } from "./createRelayEnvironment";

const socket = io();
const networkInterface = createSocketIOGraphQLClient<GraphQLResponse>(socket);
const environment = createRelayEnvironment(networkInterface);

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
    <TodoApplication environment={environment} />
    <GraphiQLWidget />
  </React.StrictMode>,
  document.getElementById("root")
);
