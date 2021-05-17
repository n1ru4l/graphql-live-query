# @n1ru4l/in-memory-live-query-store

[![npm version](https://img.shields.io/npm/v/@n1ru4l/in-memory-live-query-store.svg)](https://www.npmjs.com/package/@n1ru4l/in-memory-live-query-store) [![npm downloads](https://img.shields.io/npm/dm/@n1ru4l/in-memory-live-query-store.svg)](https://www.npmjs.com/package/@n1ru4l/in-memory-live-query-store)

A GraphQL live query store that tracks, invalidates and re-executes registered operations. Drop in replacement for `graphql-js` `execute`. Add live query capabilities to your existing GraphQL schema.

Check out the [todo example server](https://github.com/n1ru4l/graphql-live-queries/blob/main/packages/todo-example/server/src/schema.ts) for a sample integration.

## Install Instructions

```bash
yarn add -E @n1ru4l/in-memory-live-query-store
```

## API

### `InMemoryLiveQueryStore`

A `InMemoryLiveQueryStore` instance  tracks, invalidates and re-executes registered live query operations.

The store will keep track of all root query field coordinates (e.g. `Query.todos`) and global resource identifiers (e.g. `Todo:1`). The store can than be notified to re-execute live query operations that select a given root query field or resource identifier by calling the `invalidate` method with the corresponding values.

A resource identifier is composed out of the typename and the actual resolved id value separated by a colon, but can be customized. For ensuring that the store keeps track of all your query resources you should always select the `id` field on your object types. The store will only keep track of fields with the name `id` and the type `ID!` (`GraphQLNonNull(GraphQLID)`).

```ts
import { InMemoryLiveQueryStore } from "@n1ru4l/in-memory-live-query-store";
import { parse } from "graphql";
import { schema } from "./schema";

const inMemoryLiveQueryStore = new InMemoryLiveQueryStore();

const rootValue = {
  todos: [
    {
      id: "1",
      content: "Foo",
      isComplete: false,
    },
  ],
};

inMemoryLiveQueryStore
  .execute({
    schema, // make sure your schema has the GraphQLLiveDirective from @n1ru4l/graphql-live-query
    operationDocument: parse(/* GraphQL */ `
      query todosQuery @live {
        todos {
          id
          content
          isComplete
        }
      }
    `),
    rootValue: rootValue,
    contextValue: {},
    variableValues: null,
    operationName: "todosQuery",
  })
  .then(async (result) => {
    if (isAsyncIterable(result)) {
      for (const value of result) {
        console.log(value);
      }
    }
  });

// Invalidate by resource identifier
rootValue.todos[0].isComplete = true;
inMemoryLiveQueryStore.invalidate(`Todo:1`);

// Invalidate by root query field coordinate
rootValue.todos.push({ id: "2", content: "Baz", isComplete: false });
inMemoryLiveQueryStore.invalidate(`Query.todos`);
```

The `InMemoryLiveQueryStore.execute` function is a drop-in replacement for the default `execute` function exported from `graphql-js`.

Pass it to your favorite graphql transport that supports returning `AsyncIterator` from `execute` and thus delivering incremental query execution results.

List of known and tested compatible transports/servers:

| Package                                                                                                                          | Transport                   | Version                                                                                                                                                                         | Downloads                                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`@n1ru4l/socket-io-graphql-server`](https://github.com/n1ru4l/graphql-live-queries/blob/main/packages/socket-io-graphql-server) | WebSocket/HTTP Long Polling | [![npm version](https://badge.fury.io/js/%40n1ru4l%2Fsocket-io-graphql-server.svg)](https://github.com/n1ru4l/graphql-live-queries/blob/main/packages/socket-io-graphql-server) | [![npm downloads](https://img.shields.io/npm/dm/@n1ru4l/socket-io-graphql-server.svg)](https://github.com/n1ru4l/graphql-live-queries/blob/main/packages/socket-io-graphql-server) |
| [`graphql-helix`](https://github.com/danielrearden/graphql-helix)                                                                | HTTP/SSE                    | [![npm version](https://badge.fury.io/js/graphql-helix.svg)](https://github.com/danielrearden/graphql-helix)                                                                    | [![npm downloads](https://img.shields.io/npm/dm/graphql-helix.svg)](https://github.com/danielrearden/graphql-helix)                                                                |
| [`graphql-ws`](https://github.com/enisdenjo/graphql-ws)                                                                          | WebSocket                   | [![npm version](https://badge.fury.io/js/graphql-ws.svg)](https://github.com/enisdenjo/graphql-ws)                                                                              | [![npm downloads](https://img.shields.io/npm/dm/graphql-ws.svg)](https://github.com/enisdenjo/graphql-ws)                                                                          |


## Recipes

### Using with Redis

You can use Redis to synchronize invalidations across multiple instances.

```ts
import Redis from 'ioredis'
import { InMemoryLiveQueryStore } from '@n1ru4l/in-memory-live-query-store'
import {
  execute as defaultExecute,
  ExecutionArgs,
  ExecutionResult
} from 'graphql'
import { LiveExecutionResult } from '@n1ru4l/graphql-live-query'

declare type MaybePromise<T> = T | Promise<T>

declare type ExecutionParameter =
  | Parameters<typeof defaultExecute>
  | [ExecutionArgs]

export interface LiveQueryStore {
  invalidate: (identifiers: Array<string> | string) => Promise<void>
  execute: (
    ...args: ExecutionParameter
  ) => MaybePromise<
    | AsyncIterableIterator<ExecutionResult | LiveExecutionResult>
    | ExecutionResult
  >
}

const CHANNEL = 'LIVE_QUERY_INVALIDATIONS'

export class RedisLiveQueryStore {
  pub: Redis.Redis
  sub: Redis.Redis
  liveQueryStore: InMemoryLiveQueryStore

  constructor(redisUrl: string) {
    this.pub = new Redis(redisUrl)
    this.sub = new Redis(redisUrl)
    this.liveQueryStore = new InMemoryLiveQueryStore()

    this.sub.subscribe(CHANNEL, err => {
      if (err) throw err
    })

    this.sub.on('message', (channel, resourceIdentifier) => {
      if (channel === CHANNEL && resourceIdentifier)
        this.liveQueryStore.invalidate(resourceIdentifier)
    })
  }

  async invalidate(identifiers: Array<string> | string) {
    if (typeof identifiers === 'string') {
      identifiers = [identifiers]
    }
    for (const identifier of identifiers) {
      this.pub.publish(CHANNEL, identifier)
    }
  }

  execute(...args: ExecutionParameter) {
    return this.liveQueryStore.execute(...args)
  }
}
```
