# @n1ru4l/socket-io-graphql-client

[![npm version](https://img.shields.io/npm/v/@n1ru4l/socket-io-graphql-client.svg)](https://www.npmjs.com/package/@n1ru4l/socket-io-graphql-client) [![npm downloads](https://img.shields.io/npm/dm/@n1ru4l/socket-io-graphql-client.svg)](https://www.npmjs.com/package/@n1ru4l/socket-io-graphql-client)

Execute GraphQL operations against a [`@n1ru4l/socket-io-graphql-server`](https://github.com/n1ru4l/graphql-live-queries/tree/main/packages/socket-io-graphql-server) instance.

If you want to see usage we recommend checking out [the example clients for relay, apollo and urql](https://github.com/n1ru4l/graphql-live-queries/tree/main/packages/todo-example)!

## Install Instructions

```bash
yarn add -E @n1ru4l/socket-io-graphql-client
```

## API

### `createSocketIOGraphQLClient`

```ts
import { io } from "socket.io-client";
import { createSocketIOGraphQLClient } from "@n1ru4l/socket-io-graphql-client";
const socket = io();
const socketIOGraphQLClient = createSocketIOGraphQLClient(socket);

socketIOGraphQLClient.execute(
  {
    operation: /* GraphQL */ `
      query messages {
        id
        content
      }
    `,
  },
  {
    next: console.log,
    error: console.error,
    complete: () => console.log("complete"),
  }
);

socketIOGraphQLClient.execute(
  {
    operation: /* GraphQL */ `
      query messages @live {
        id
        content
      }
    `,
  },
  {
    next: console.log,
    error: console.error,
    complete: () => console.log("complete"),
  }
);

const dispose = socketIOGraphQLClient.execute(
  {
    operation: /* GraphQL */ `
      subscription onNewMessage {
        onNewMessage {
          id
          content
        }
      }
    `,
  },
  {
    next: console.log,
    error: console.error,
    complete: () => console.log("complete"),
  }
);

setTimeout(dispose, 5000);
```

## Recipes

### GraphiQL Fetcher

```tsx
import { io } from "socket.io-client";
import { createSocketIOGraphQLClient } from "@n1ru4l/socket-io-graphql-client";
import "graphiql/graphiql.css";
import GraphiQL from "graphiql";

const socket = io();
const socketIOGraphQLClient = createSocketIOGraphQLClient(socket);

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

      const unsubscribe = (socketIOGraphQLClient as SocketIOGraphQLClient<
        FetcherResult
      >).execute(
        {
          operation,
          ...restGraphQLParams,
        },
        sink
      );

      return { unsubscribe };
    },
  } as any);

export const LiveGraphiQL = (): React.ReactElement => (
  <GraphiQL fetcher={fetcher} />
);
```

### Relay Environment

As used in the `relay todo example app`(https://github.com/n1ru4l/graphql-live-queries/tree/main/packages/todo-example/client-relay).

```tsx
import { SocketIOGraphQLClient } from "@n1ru4l/socket-io-graphql-client";
import {
  Environment,
  Network,
  RecordSource,
  Store,
  Observable,
  GraphQLResponse,
  RequestParameters,
  Variables,
} from "relay-runtime";

export const createRelayEnvironment = (
  networkInterface: SocketIOGraphQLClient<GraphQLResponse, Error>
) => {
  const execute = (request: RequestParameters, variables: Variables) => {
    if (!request.text) throw new Error("Missing document.");
    const { text: operation, name } = request;

    return Observable.create<GraphQLResponse>((sink) =>
      networkInterface.execute(
        {
          operation,
          variables,
          operationName: name,
        },
        sink
      )
    );
  };

  const network = Network.create(execute, execute);
  const store = attachNotifyGarbageCollectionBehaviourToStore(
    new Store(new RecordSource())
  );

  return new Environment({
    network,
    store,
  });
};
```

### Apollo Client

As used in the `apollo client todo example app`(https://github.com/n1ru4l/graphql-live-queries/tree/main/packages/todo-example/client-apollo).

```tsx
import { SocketIOGraphQLClient } from "@n1ru4l/socket-io-graphql-client";
import {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  Operation,
  Observable,
  FetchResult,
  Observable,
} from "@apollo/client";
import { print } from "graphql";

class SocketIOGraphQLApolloLink extends ApolloLink {
  private networkLayer: SocketIOGraphQLClient;
  constructor(networkLayer: SocketIOGraphQLClient) {
    super();
    this.networkLayer = networkLayer;
  }

  public request(operation: Operation): Observable<FetchResult> | null {
    return new Observable((sink) =>
      this.networkLayer.execute({
        operationName: operation.operationName,
        operation: print(operation.query),
        variables: operation.variables,
      })
    );
  }
}

export const createApolloClient = (networkInterface: SocketIOGraphQLClient) => {
  return new ApolloClient({
    link: new SocketIOGraphQLApolloLink(networkInterface),
    cache: new InMemoryCache(),
  });
};
```

### Urql

As used in the `urql todo example app`(https://github.com/n1ru4l/graphql-live-queries/tree/main/packages/todo-example/client-urql).

```tsx
import { SocketIOGraphQLClient } from "@n1ru4l/socket-io-graphql-client";
import {
  Client,
  dedupExchange,
  cacheExchange,
  subscriptionExchange,
  ExecutionResult,
} from "urql";

export const createUrqlClient = (
  networkInterface: SocketIOGraphQLClient<ExecutionResult>
) => {
  return new Client({
    url: "noop",
    exchanges: [
      dedupExchange,
      cacheExchange,
      subscriptionExchange({
        forwardSubscription: (operation) => ({
          subscribe: (sink) => ({
            unsubscribe: networkInterface.execute(
              {
                operation: operation.query,
                variables: operation.variables,
              },
              sink
            ),
          }),
        }),
        enableAllOperations: true,
      }),
    ],
  });
};
```
