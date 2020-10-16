# @n1ru4l/socket-io-graphql-client

Execute GraphQL operations against a [`@n1ru4l/socket-io-graphql-server`](https://github.com/n1ru4l/graphql-live-queries/tree/main/packages/socket-io-graphql-server) instance.

If you want to see usage we recommend checking out [the example clients for relay, apollo and urql](https://github.com/n1ru4l/graphql-live-queries/tree/main/packages/todo-example)!

## Install

```bash
yarn add -E @n1ru4l/socket-io-graphql-client
```

## Usage

```ts
const socket = io();
const socketIOGraphQLClient = createSocketIOGraphQLClient(socket);

socketIOGraphQLClient
  .execute({
    operation: /* GraphQL */ `
      query messages {
        id
        content
      }
    `,
  })
  .subscribe({
    next: console.log,
    error: console.log,
    complete: console.log,
  });

socketIOGraphQLClient
  .execute({
    operation: /* GraphQL */ `
      query messages @live {
        id
        content
      }
    `,
  })
  .subscribe({
    next: console.log,
    error: console.log,
    complete: console.log,
  });

socketIOGraphQLClient
  .execute({
    operation: /* GraphQL */ `
      subscription onNewMessage {
        onNewMessage {
          id
          content
        }
      }
    `,
  })
  .subscribe({
    next: console.log,
    error: console.log,
    complete: console.log,
  });
```

## Recipes

### GraphiQL Fetcher

```tsx
import io from "socket.io-client";
import { createSocketIOGraphQLClient } from "@n1ru4l/socket-io-graphql-client";
import "graphiql/graphiql.css";
import GraphiQL from "graphiql";

const socket = io();
const socketIOGraphQLClient = createSocketIOGraphQLClient(socket);

const fetcher = ({ query: operation, ...execRest }: any) =>
  socketIOGraphQLClient.execute({ operation, ...execRest });

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
  FetchFunction,
  SubscribeFunction,
  Observable,
} from "relay-runtime";

export const createRelayEnvironment = (
  networkInterface: SocketIOGraphQLClient
) => {
  const fetchQuery: FetchFunction = (request, variables) => {
    if (!request.text) throw new Error("Missing document.");
    const { text: operation, name } = request;

    return Observable.create((sink) => {
      const observable = networkInterface.execute({
        query: operation,
        variables: variables,
        operationName: name,
      });

      const subscription = observable.subscribe(sink);

      return () => {
        subscription.unsubscribe();
      };
    });
  };

  const setupSubscription: SubscribeFunction = (request, variables) => {
    if (!request.text) throw new Error("Missing document.");
    const { text: operation, name } = request;

    return Observable.create((sink) => {
      const observable = networkInterface.execute({
        query: operation,
        variables: variables,
        operationName: name,
      });

      const subscription = observable.subscribe(sink);

      return () => {
        subscription.unsubscribe();
      };
    });
  };

  const environment = new Environment({
    network: Network.create(fetchQuery, setupSubscription),
    store: new Store(new RecordSource()),
  });

  return environment;
};
```

### Apollo CLient

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
} from "@apollo/client";
import { print } from "graphql";

class SocketIOGraphQLApolloLink extends ApolloLink {
  private networkLayer: SocketIOGraphQLClient;
  constructor(networkLayer: SocketIOGraphQLClient) {
    super();
    this.networkLayer = networkLayer;
  }

  public request(operation: Operation): Observable<FetchResult> | null {
    const sink = this.networkLayer.execute({
      operationName: operation.operationName,
      operation: print(operation.query),
      variables: operation.variables,
    });

    return sink as Observable<FetchResult>;
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
} from "urql";

export const createUrqlClient = (networkInterface: SocketIOGraphQLClient) => {
  return new Client({
    url: "noop",
    exchanges: [
      dedupExchange,
      cacheExchange,
      subscriptionExchange({
        forwardSubscription: (operation) => {
          return networkInterface.execute({
            operation: operation.query,
            variables: operation.variables,
          });
        },
        enableAllOperations: true,
      }),
    ],
  });
};
```
