# @n1ru4l/graphql-live-query-patch

[![npm version](https://img.shields.io/npm/v/@n1ru4l/graphql-live-query-patch.svg)](https://www.npmjs.com/package/@n1ru4l/graphql-live-query-patch) [![npm downloads](https://img.shields.io/npm/dm/@n1ru4l/graphql-live-query-patch.svg)](https://www.npmjs.com/package/@n1ru4l/graphql-live-query-patch)

Make your live query payload smaller with json patches.

## Install Instructions

```bash
yarn add -E @n1ru4l/graphql-live-query-patch
```

## API

### `createLiveQueryPatchDeflator`

```ts
import { execute } from "graphql";
import { createLiveQueryPatchDeflator } from "@n1ru4l/graphql-live-query-patch";
import { schema } from "./schema";

execute({
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
}).then(async (result) => {
  if (isAsyncIterable(result)) {
    for (const value of createLiveQueryPatchDeflator(result)) {
      console.log(value);
    }
  }
});
```

### `createLiveQueryPatchInflator`

```ts
import { createLiveQueryPatchInflator } from "@n1ru4l/graphql-live-query-patch";

networkLayer
  .execute({
    operation: /* GraphQL */ `
      query todosQuery @live {
        todos {
          id
          content
          isComplete
        }
      }
    `,
  })
  .then((result) => {
    if (isAsyncIterable(result)) {
      for (const value of createLiveQueryPatchInflator(result)) {
        console.log(value);
      }
    }
  });
```
