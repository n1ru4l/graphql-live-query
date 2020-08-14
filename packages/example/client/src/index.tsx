import * as React from "react";
import * as ReactDom from "react-dom";
import { ThemeProvider, CSSReset } from "@chakra-ui/core";
import { useRoutes } from "react-router";
import { GraphiQLRoute } from "./GraphiQLRoute";
import { BrowserRouter } from "react-router-dom";
import { Global, css } from "@emotion/core";
import io from "socket.io-client";
import { createSocketIOGraphQLClient } from "@n1ru4l/socket-io-graphql-client";
import { ChatApplication } from "./ChatApplication";
import { createRelayEnvironment } from "./createRelayEnvironment";

const root = window.document.getElementById("root");

const socket = io();

const socketIOGraphQLClient = createSocketIOGraphQLClient(socket);
const relayEnvironment = createRelayEnvironment(socketIOGraphQLClient);

const App: React.FunctionComponent = () => {
  const match = useRoutes([
    {
      path: "/",
      element: <ChatApplication relayEnvironment={relayEnvironment} />,
    },
    {
      path: "/graphql",
      element: (
        <GraphiQLRoute
          fetcher={({ query: operation, ...execRest }: any) =>
            socketIOGraphQLClient.execute({ operation, ...execRest })
          }
        />
      ),
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
