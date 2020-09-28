# @n1ru4l/in-memory-live-query-store

A live query store for GraphQL servers that holds the information about the live queries in memory.

## Install

```
yarn add -E @n1ru4l/in-memory-live-query-store
```

## Usage

The `InMemoryLiveQueryStore` can be used to register a live query. The store will keep track of all root query field coordinates (e.g. `Query.todos`) and global resource identifiers (e.q. `Todo:1`). The store can than be notified to re-execute queries that select a given root query field or resource identifier by notifying it via the `triggerUpdate` method with the corresponding input. A resource identifier is composed out of the typename and the actual resolved id value separated by a colon. For ensuring that the store keeps track of all your query resources you should always select the `id` field on your object types. The store will only keep track of fields with the name `id` and the type `ID!` (`GraphQLNonNull(GraphQLID)`).

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

const registration = inMemoryLiveQueryStore.register({
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
  operationVariables: null,
  operationName: "todosQuery",
  publishUpdate: console.log,
});

rootValue.todos[0].isComplete = true;
inMemoryLiveQueryStore.triggerUpdate(`Todo:1`);
rootValue.todos.push({ id: "2", content: "Baz", isComplete: false });
inMemoryLiveQueryStore.triggerUpdate(`Query.todos`);
```
