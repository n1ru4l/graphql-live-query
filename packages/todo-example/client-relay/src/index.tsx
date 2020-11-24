import React from "react";
import ReactDOM from "react-dom";
import { createSocketIOGraphQLClient } from "@n1ru4l/socket-io-graphql-client";
import { TodoApplication } from "./TodoApplication";

import { io } from "socket.io-client";
import { createRelayEnvironment } from "./createRelayEnvironment";
import "todomvc-app-css/index.css";
import { GraphQLResponse } from "relay-runtime";

const socket = io();
const networkInterface = createSocketIOGraphQLClient<GraphQLResponse>(socket);
const environment = createRelayEnvironment(networkInterface);

ReactDOM.render(
  <React.StrictMode>
    <TodoApplication environment={environment} />
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
