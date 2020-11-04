import socketIO from "socket.io";
import http from "http";
import type { Socket } from "net";
import { InMemoryLiveQueryStore } from "@n1ru4l/in-memory-live-query-store";
import { registerSocketIOGraphQLServer } from "@n1ru4l/socket-io-graphql-server";
import { schema } from "./schema";

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

const socketServer = socketIO(server);
const liveQueryStore = new InMemoryLiveQueryStore();
const rootValue = {
  todos: new Map(),
};

rootValue.todos.set("1", {
  id: "1",
  content: "foo",
  isCompleted: false,
});

registerSocketIOGraphQLServer({
  socketServer,
  getParameter: () => ({
    execute: liveQueryStore.execute,
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
