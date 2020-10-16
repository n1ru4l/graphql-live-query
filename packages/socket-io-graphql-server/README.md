# @n1ru4l/socket-io-graphql-server

A layer for serving a GraphQL schema via a socket.io server. Supports Queries, Mutations, Subscriptions and Live Queries.

**Note:** Use [`@n1ru4l/socket-io-graphql-client`](https://github.com/n1ru4l/graphql-live-queries/tree/main/packages/socket-io-graphql-client) for executing operations against the server.

For a full setup check out the [todo-example-server](https://github.com/n1ru4l/graphql-live-queries/tree/main/packages/todo-example/server).

## Install

```bash
yarn add -E @n1ru4l/socket-io-graphql-server
```

## Recipies

### Setting up a server

```ts
import socketIO from "socket.io";

const socketServer = socketIO();

registerSocketIOGraphQLServer({
  socketServer,
});
```

### Setting up live queries

You must also install `@n1ru4l/in-memory-live-query-store` (or implement your own live query execute function).

```bash
yarn add -E @n1ru4l/in-memory-live-query-store
```

```ts
import socketIO from "socket.io";
import { InMemoryLiveQueryStore } from "@n1ru4l/in-memory-live-query-store";

// liveQueryStore is fully optional
// you can even use your own implementation
const liveQueryStore = new InMemoryLiveQueryStore();

registerSocketIOGraphQLServer({
  socketServer,
  /* getParameter is invoked for each operation. */
  getParameter: ({ socket }) => ({
    executeLiveQuery: liveQueryStore.execute,
    /* The paramaters used for the operation execution. */
    graphQLExecutionParameter: {
      schema,
      rootValue:,
      contextValue: {
        socket,
        liveQueryStore,
      },
    },
  }),
});
```

### Lazy Socket Authentication

Sometimes you only want to permit a socket executing stuff after authentication.

```ts
import socketIO from "socket.io";

const socketServer = socketIO();

const graphQLServer = registerSocketIOGraphQLServer({
  socketServer,
  getParameter: () => ({
    executeLiveQuery: liveQueryStore.execute,
    graphQLExecutionParameter: {
      schema,
      rootValue,
      contextValue: {
        liveQueryStore,
      },
    },
  }),
  // do not automatically register each socket for operation execution
  isLazy: true,
});

socketServer.on("connect", (socket) => {
  socket.on("auth", (message) => {
    if (checkAuth(message)) {
      // now socket is allowed to execute GraphQL operations.
      graphQLServer.registerSocket(socket);
    }
  });
});
```

### Persisted Operations

```ts
import socketIO from "socket.io";
import { InMemoryLiveQueryStore } from "@n1ru4l/graphql-live-query-store";

const persistedOperations = {
    "1": "query { ping }"
    "2": "mutation { ping }"
}

const socketServer = socketIO();

const graphqlServer  = registerSocketIOGraphQLServer({
  socketServer,
  getParameter: ({ socket, graphQLPayload }) => ({
    /* The paramaters used for the operation execution. */
    graphQLExecutionParameter: {
      schema,
      rootValue:,
      contextValue: {
        socket,
        liveQueryStore,
      },
      // client source is just the id instead of a full document.
      // we map the id to the actual document.
      source: persistedOperations[graphQLPayload.source]
    },
  }),
});
```

### Destroy GraphQL Server

```ts
const server = registerSocketIOGraphQLServer({
  socketServer,
  getParameter: ({ socket }) => ({
    executeLiveQuery: liveQueryStore.execute,
    graphQLExecutionParameter: {
      schema,
      rootValue,
      contextValue: {
        liveQueryStore,
      },
    },
  }),
});

server.destroy();
```
