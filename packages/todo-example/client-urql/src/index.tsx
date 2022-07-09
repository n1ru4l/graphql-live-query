import React, { ReactElement } from "react";
import ReactDOM from "react-dom";
import "todomvc-app-css/index.css";
import { Provider, Client } from "urql";

import { TodoApplication } from "./TodoApplication";

const Root = (): ReactElement | null => {
  const [client, setClient] = React.useState<Client | null>(null);

  React.useEffect(() => {
    if (globalThis.location.search.includes("sse")) {
      import("./urql-client/http-client").then(async ({ createUrqlClient }) => {
        setClient(
          createUrqlClient(
            `${window.location.protocol}//${window.location.host}/graphql`
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
