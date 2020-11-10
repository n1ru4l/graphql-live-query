import React from "react";
import ReactDOM from "react-dom";
import { createSocketIOGraphQLClient } from "@n1ru4l/socket-io-graphql-client";
import { TodoApplication } from "./TodoApplication";

import { io } from "socket.io-client";
import { createApolloClient } from "./createApolloClient";
import "todomvc-app-css/index.css";
import { ApolloProvider, FetchResult } from "@apollo/client";

const socket = io();
const networkInterface = createSocketIOGraphQLClient<FetchResult>(socket);
const apolloClient = createApolloClient(networkInterface);

ReactDOM.render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <TodoApplication />
    </ApolloProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
