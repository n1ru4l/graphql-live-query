import * as React from "react";
import * as ReactDOM from "react-dom";
import { createSocketIOGraphQLClient } from "@n1ru4l/socket-io-graphql-client";
import { GraphQLResponse } from "relay-runtime";
import "todomvc-app-css/index.css";
import { io } from "socket.io-client";
import { TodoApplication } from "./TodoApplication";
import { createRelayEnvironment } from "./createRelayEnvironment";

let host = new URLSearchParams(window.location.search).get("host") ?? undefined;
const socket = host ? io(host) : io();
const networkInterface = createSocketIOGraphQLClient<GraphQLResponse>(socket);
const environment = createRelayEnvironment(networkInterface);

ReactDOM.render(
  <React.StrictMode>
    <TodoApplication environment={environment} />
  </React.StrictMode>,
  document.getElementById("root")
);
