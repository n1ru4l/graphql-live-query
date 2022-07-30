import * as React from "react";
import * as ReactDOM from "react-dom";
import type { Environment } from "relay-runtime";
import "todomvc-app-css/index.css";
import { TodoApplication } from "./TodoApplication";
import { createRelayEnvironment } from "./createRelayEnvironment";

const Root = () => {
  const [environment, setEnvironment] = React.useState<Environment | null>(
    null
  );

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sse")) {
      const host = params.get("host") ?? undefined;
      import("./fetcher/create-http-fetcher").then(({ createHTTPFetcher }) => {
        setEnvironment(
          createRelayEnvironment(
            createHTTPFetcher(
              (host ?? `${window.location.protocol}//${window.location.host}`) +
                "/graphql"
            )
          )
        );
      });
    } else if (params.get("ws")) {
      const host = params.get("host") ?? undefined;
      import("./fetcher/create-ws-fetcher").then(({ createWSFetcher }) => {
        setEnvironment(
          createRelayEnvironment(
            createWSFetcher(
              (host ?? `ws://${window.location.host}`) + "/graphql"
            )
          )
        );
      });
    } else {
      import("./fetcher/create-socket-io-fetcher").then(
        ({ createSocketIOFetcher }) => {
          setEnvironment(createRelayEnvironment(createSocketIOFetcher()));
        }
      );
    }
  }, []);

  if (environment === null) {
    return null;
  }

  return <TodoApplication environment={environment} />;
};

ReactDOM.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
  document.getElementById("root")
);
