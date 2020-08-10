import * as tinyhttpApp from "@tinyhttp/app";
import * as tinyhttpLogger from "@tinyhttp/logger";
import socketIO from "socket.io";
import * as net from "net";
import * as graphqlSchema from "./graphql/schema";
import * as fakeData from "./fakeData";

import { registerGraphQLLayer } from "./registerGraphQLLayer";
import { siteContent } from "./static-html";
import { UserStore } from "./user-store";
import { SimpleLiveQueryStore } from "@n1ru4l/graphql-live-query-simple-store";
import { MessageStore } from "./message-store";

const app = new tinyhttpApp.App();

const parsePortSafe = (port: string) => {
  const parsedPort = parseInt(port, 10);
  if (Number.isNaN(parsedPort)) {
    return 3000;
  }
  return parsedPort;
};

const server = app
  .use(tinyhttpLogger.logger())
  .use("/graphql", (req, res) => res.send(siteContent))
  .listen(parsePortSafe(process.env.PORT || "3000"));

const socketServer = socketIO(server);

const liveQueryStore = new SimpleLiveQueryStore();
const userStore = new UserStore();
const messageStore = new MessageStore();

setInterval(() => {
  userStore.add(fakeData.createFakeUser());
  liveQueryStore.triggerUpdate("Query.users");
}, 5000).unref();

setInterval(() => {
  // all live queries that select Query.users will receive an update.
  const user = userStore.getRandom();
  if (user) {
    messageStore.add(fakeData.createFakeMessage(user.id));
    liveQueryStore.triggerUpdate("Query.messages");
  }
}, 1619).unref();

registerGraphQLLayer({
  socketServer,
  schema: graphqlSchema.schema,
  liveQueryStore,
  createContext: () => ({ userStore, messageStore, liveQueryStore }),
});

const connections = new Set<net.Socket>();
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
