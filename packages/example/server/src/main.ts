import * as tinyhttpApp from "@tinyhttp/app";
import * as tinyhttpLogger from "@tinyhttp/logger";
import socketIO from "socket.io";
import * as net from "net";
import * as graphqlSchema from "./graphql/schema";
import * as fakeData from "./fakeData";

import { UserStore } from "./user-store";
import { InMemoryLiveQueryStore } from "@n1ru4l/in-memory-live-query-store";
import { registerSocketIOGraphQLServer } from "@n1ru4l/socket-io-graphql-server";
import { MessageStore } from "./message-store";
import { PubSub } from "graphql-subscriptions";

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
  .use("/", (req, res) => res.send("Hello World."))
  .listen(parsePortSafe(process.env.PORT || "3001"));

const socketServer = socketIO(server);

const subscriptionPubSub = new PubSub();
const liveQueryStore = new InMemoryLiveQueryStore({});
const userStore = new UserStore();
const messageStore = new MessageStore();

// lets add some new users randomly
setInterval(() => {
  userStore.add(fakeData.createFakeUser());
  liveQueryStore.emit("Query.users");
}, 10000).unref();

// lets add some new messages randomly
setInterval(() => {
  // all live queries that select Query.users will receive an update.
  const user = userStore.getRandom();
  if (user) {
    const newMessage = fakeData.createFakeMessage(user.id);
    messageStore.add(newMessage);
    liveQueryStore.emit("Query.messages");
    subscriptionPubSub.publish("onNewMessage", { messageId: newMessage.id });
  }
}, 100).unref();

// Lets change some messages randomly
setInterval(() => {
  const user = userStore.getRandom();
  if (user) {
    const message = messageStore.getLast();
    if (message) {
      message.content = fakeData.randomSentence();
      liveQueryStore.emit("Query.messages");
    }
  }
}, 2000).unref();

registerSocketIOGraphQLServer({
  socketServer,
  getExecutionParameter: () => ({
    liveQueryStore,
    graphQLExecutionParameter: {
      schema: graphqlSchema.schema,
      contextValue: {
        userStore,
        messageStore,
        liveQueryStore,
        subscriptionPubSub,
      },
    },
  }),
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
