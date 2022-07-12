import React from "react";
import ReactDOM from "react-dom";
import "todomvc-app-css/index.css";
import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client";
import { TodoApplication } from "./TodoApplication";

const createApolloClient = (link: ApolloLink) =>
  new ApolloClient({
    link,
    cache: new InMemoryCache(),
  });

const Root = (): React.ReactElement | null => {
  const [client, setClient] =
    React.useState<ApolloClient<NormalizedCacheObject> | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sse")) {
      let host = params.get("host") ?? undefined;
      import("./apollo-link/create-http-apollo-link").then(
        async ({ createHTTPApolloLink }) => {
          setClient(
            createApolloClient(
              createHTTPApolloLink(
                (host ??
                  `${window.location.protocol}//${window.location.host}`) +
                  "/graphql"
              )
            )
          );
        }
      );
    } else {
      import("./apollo-link/create-socket-io-apollo-link").then(
        async ({ createSocketIOApolloLink }) => {
          setClient(createApolloClient(createSocketIOApolloLink()));
        }
      );
    }
  }, []);

  if (client === null) {
    return null;
  }

  return (
    <ApolloProvider client={client}>
      <TodoApplication />
    </ApolloProvider>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
  document.getElementById("root")
);
