# @n1ru4l/graphql-live-query

[![npm version](https://img.shields.io/npm/v/@n1ru4l/graphql-live-query.svg)](https://www.npmjs.com/package/@n1ru4l/graphql-live-query) [![npm downloads](https://img.shields.io/npm/dm/@n1ru4l/graphql-live-query.svg)](https://www.npmjs.com/package/@n1ru4l/graphql-live-query)

Primitives for adding GraphQL live query operation support to any GraphQL server.

For a usage of those utility functions check out `InMemoryLiveQueryStore`(https://github.com/n1ru4l/graphql-live-queries/tree/main/packages/in-memory-live-query-store/src/InMemoryLiveQueryStore.ts).

## Install Instructions

```bash
yarn add -E @n1ru4l/graphql-live-query
```

## API

### `GraphQLLiveDirective`

Add the `@live` directive to your schema.

```ts
import { GraphQLSchema, specifiedDirectives } from "graphql";
import { GraphQLLiveDirective } from "@n1ru4l/graphql-live-query";
import { query, mutation, subscription } from "./schema";

const schema = new GraphQLSchema({
  query,
  mutation,
  subscription,
  directives: [
    GraphQLLiveDirective,
    /* Keep @defer/@stream/@if/@skip */ ...specifiedDirectives,
  ],
});
```

### `isLiveQueryOperationDefinitionNode`

Determine whether a `DefinitionNode` is a `LiveQueryOperationDefinitionNode`.

```ts
import { parse } from "graphql";
import { isLiveQueryOperationDefinitionNode } from "@n1ru4l/graphql-live-query";

const liveQueryOperationDefinitionNode = parse(/* GraphQL */ `
  query @live {
    me {
      id
      login
    }
  }
`);

isLiveQueryOperationDefinitionNode(
  liveQueryOperationDefinitionNode.definitions[0]
); // true

const queryOperationDefinitionNode = parse(/* GraphQL */ `
  query {
    me {
      id
      login
    }
  }
`);

isLiveQueryOperationDefinitionNode(queryOperationDefinitionNode.definitions[0]); // false
```
