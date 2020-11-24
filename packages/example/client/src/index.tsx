import * as React from "react";
import * as ReactDom from "react-dom";
import { ThemeProvider, CSSReset } from "@chakra-ui/core";
import { useRoutes } from "react-router";
import { GraphQLResponse } from "relay-runtime";
import { GraphiQLRoute } from "./GraphiQLRoute";
import { BrowserRouter } from "react-router-dom";
import { Global, css } from "@emotion/core";
import { io } from "socket.io-client";
import {
  createSocketIOGraphQLClient,
  SocketIOGraphQLClient,
} from "@n1ru4l/socket-io-graphql-client";
import { applyAsyncIterableIteratorToSink } from "@n1ru4l/push-pull-async-iterable-iterator";
import { ChatApplication } from "./ChatApplication";
import { createRelayEnvironment } from "./createRelayEnvironment";
import { Fetcher, FetcherResult } from "graphiql/dist/components/GraphiQL";

const root = window.document.getElementById("root");

const socket = io();

const socketIOGraphQLClient = createSocketIOGraphQLClient(socket);
const relayEnvironment = createRelayEnvironment(
  socketIOGraphQLClient as SocketIOGraphQLClient<GraphQLResponse>
);

export type Sink<TValue = unknown, TError = unknown> = {
  next: (value: TValue) => void;
  error: (error: TError) => void;
  complete: () => void;
};

const fetcher: Fetcher = ({ query: operation, ...restGraphQLParams }) =>
  ({
    subscribe: (
      sinkOrNext: Sink["next"] | Sink,
      ...args: [Sink["error"], Sink["complete"]]
    ) => {
      const sink: Sink =
        typeof sinkOrNext === "function"
          ? { next: sinkOrNext, error: args[0], complete: args[1] }
          : sinkOrNext;

      const unsubscribe = applyAsyncIterableIteratorToSink(
        (socketIOGraphQLClient as SocketIOGraphQLClient<FetcherResult>).execute(
          {
            operation,
            ...restGraphQLParams,
          }
        ),
        sink
      );

      return { unsubscribe };
    },
  } as any);

const App: React.FunctionComponent = () => {
  const match = useRoutes([
    {
      path: "/",
      element: <ChatApplication relayEnvironment={relayEnvironment} />,
    },
    {
      path: "/graphql",
      element: <GraphiQLRoute fetcher={fetcher} />,
    },
  ]);
  return match;
};

ReactDom.render(
  <BrowserRouter>
    <ThemeProvider>
      <CSSReset />
      <Global
        styles={css`
          html {
            padding: 0;
            margin: 0;
          }
          html {
            height: 100%;
          }
          body {
            min-height: 100%;
          }
          #root {
            min-height: 100%;
          }
        `}
      />
      <App />
    </ThemeProvider>
  </BrowserRouter>,
  root
);
