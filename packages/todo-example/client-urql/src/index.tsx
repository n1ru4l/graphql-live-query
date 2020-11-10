import React from "react";
import ReactDOM from "react-dom";
import { createSocketIOGraphQLClient } from "@n1ru4l/socket-io-graphql-client";
import { TodoApplication } from "./TodoApplication";

import { io } from "socket.io-client";
import { createUrqlClient } from "./createUrgqlClient";
import "todomvc-app-css/index.css";
import { Provider, ExecutionResult } from "urql";

const socket = io();
const networkInterface = createSocketIOGraphQLClient<ExecutionResult>(socket);
const urqlClient = createUrqlClient(networkInterface);

ReactDOM.render(
  <React.StrictMode>
    <Provider value={urqlClient}>
      <TodoApplication />
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
