import { Server as IOServer } from "socket.io";
import http from "http";
import type { Socket } from "net";
import { NoLiveMixedWithDeferStreamRule } from "@n1ru4l/graphql-live-query";
import { InMemoryLiveQueryStore } from "@n1ru4l/in-memory-live-query-store";
import { registerSocketIOGraphQLServer } from "@n1ru4l/socket-io-graphql-server";
import { schema } from "./schema";
import { validate, specifiedRules } from "graphql";

const parsePortSafe = (port: string) => {
  const parsedPort = parseInt(port, 10);
  if (Number.isNaN(parsedPort)) {
    return 3000;
  }
  return parsedPort;
};

const server = http
  .createServer((_, res) => {
    res.writeHead(404);
    res.end();
  })
  .listen(parsePortSafe(process.env.PORT || "3001"));

const socketServer = new IOServer(server);
const liveQueryStore = new InMemoryLiveQueryStore();
const rootValue = {
  todos: new Map(),
};

rootValue.todos.set("1", {
  id: "1",
  content: "foo",
  isCompleted: false,
});

const validationRules = [...specifiedRules, NoLiveMixedWithDeferStreamRule];

registerSocketIOGraphQLServer({
  socketServer,
  getParameter: () => ({
    execute: liveQueryStore.execute,
    validationRules,
    graphQLExecutionParameter: {
      schema,
      rootValue,
      contextValue: {
        liveQueryStore,
      },
    },
  }),
});

// Graceful shutdown stuff :)
// Ensure connections are closed when SIGINT is received

const connections = new Set<Socket>();
server.on("connection", (connection) => {
  connections.add(connection);
  connection.on("close", () => {
    connections.delete(connection);
  });
});

let isShuttingDown = false;

process.on("SIGINT", () => {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  server.close();
  socketServer.close();
  for (const connection of connections) {
    connection.destroy();
  }
});
