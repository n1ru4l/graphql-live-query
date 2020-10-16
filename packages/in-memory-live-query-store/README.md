# @n1ru4l/in-memory-live-query-store

A live query store for GraphQL servers that holds the information about the live queries in memory.

**Note:** If you only want a complete GraphQL transport layer (that is compatible with this package) check out [`@n1ru4l/socket-io-graphql-server`](https://github.com/n1ru4l/graphql-live-queries/tree/main/packages/socket-io-graphql-server).

Wanna see how you can add it to your existing GraphQL schema? Check out the [todo example server](https://github.com/n1ru4l/graphql-live-queries/blob/main/packages/todo-example/server/src/schema.ts).

With InMemoryLiveQueryStore you can easily add live query capabilities to your existing schema!

## Install

```bash
yarn add -E @n1ru4l/in-memory-live-query-store
```

## Usage

The `InMemoryLiveQueryStore` can be used to register a live query. The store will keep track of all root query field coordinates (e.g. `Query.todos`) and global resource identifiers (e.g. `Todo:1`). The store can than be notified to re-execute live query operations that select a given root query field or resource identifier via the `invalidate` method with the corresponding resource identifier or field coordinates. A resource identifier is composed out of the typename and the actual resolved id value separated by a colon, but can be customized. For ensuring that the store keeps track of all your query resources you should always select the `id` field on your object types. The store will only keep track of fields with the name `id` and the type `ID!` (`GraphQLNonNull(GraphQLID)`).

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
    schema,
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
