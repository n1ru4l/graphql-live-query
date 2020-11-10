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

### `NoLiveMixedWithDeferStreamRule`

Validation rule for raising a GraphQLError for a operation that use `@live` mixed with `@defer` and `@stream`.

```ts
import { parse, validate, specifiedRules } from "graphql";
import { NoLiveMixedWithDeferStreamRule } from "@n1ru4l/graphql-live-query";
import schema from "./schema";

const document = parse(/* GraphQL */ `
  query @live {
    users @stream {
      id
      login
    }
  }
`);

const [error] = validate(schema, document, [
  /* default validation rules */ ...specifiedRules,
  NoLiveMixedWithDeferStreamRule,
]);

console.log(error); // [GraphQLError: Cannot mix "@stream" with "@live".]
```
