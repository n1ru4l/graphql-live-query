import React, { ReactElement } from "react";
import ReactDOM from "react-dom";
import "todomvc-app-css/index.css";
import { Provider, Client } from "urql";

import { TodoApplication } from "./TodoApplication";

const Root = (): ReactElement | null => {
  const [client, setClient] = React.useState<Client | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sse")) {
      let host = params.get("host") ?? undefined;

      import("./urql-client/http-client").then(async ({ createUrqlClient }) => {
        setClient(
          createUrqlClient(
            (host ?? `${window.location.protocol}//${window.location.host}`) +
              "/graphql"
          )
        );
      });
    } else if (params.get("ws")) {
      let host = params.get("host") ?? undefined;
      import("./urql-client/ws-client").then(async ({ createUrqlClient }) => {
        setClient(
          createUrqlClient(
            (host ?? `ws://${window.location.host}`) + "/graphql"
          )
        );
      });
    } else {
      import("./urql-client/socket-io-client").then(
        async ({ createUrqlClient }) => {
          createUrqlClient().then(setClient);
        }
      );
    }
  }, []);

  if (client === null) {
    return null;
  }

  return (
    <Provider value={client}>
      <TodoApplication />
    </Provider>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
