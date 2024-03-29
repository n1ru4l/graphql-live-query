# @n1ru4l/graphql-live-query-patch-jsondiffpatch

[![npm version](https://img.shields.io/npm/v/@n1ru4l/graphql-live-query-patch-jsondiffpatch.svg)](https://www.npmjs.com/package/@n1ru4l/graphql-live-query-patch-jsondiffpatch) [![npm downloads](https://img.shields.io/npm/dm/@n1ru4l/graphql-live-query-patch-jsondiffpatch.svg)](https://www.npmjs.com/package/@n1ru4l/graphql-live-query-patch-jsondiffpatch)

Smaller live query payloads with [@n1ru4l/json-patch-plus](https://github.com/n1ru4l/graphql-live-query/tree/main/packages/json-patch-plus).

When having big query results JSON patches might be able to drastically reduce the payload sent to clients. Every time a new execution result is published a JSON patch is generated by diffing the previous and the next execution result. The patch operations are then sent to the client where they are applied to the initial execution result.

The `@n1ru4l/json-patch-plus` produces even smaller patches than the `jsondiffpatch` package which already produces more optimized patches than the `json-patch` package and performs much better on generating patches for lists.

**Query**

```graphql
query post($id: ID!) @live {
  post(id: $id) {
    id
    title
    totalLikeCount
  }
}
```

**Initial result**

```json
{
  "data": {
    "post": {
      "id": "1",
      "title": "foo",
      "totalLikeCount": 10
    }
  },
  "revision": 1
}
```

**Patch result (increase totalLikeCount)**

```json
{
  "patch": {
    "post": {
      "totalLikeCount": [null, 11]
    }
  },
  "revision": 2
}
```

## Install Instructions

```bash
yarn add -E @n1ru4l/graphql-live-query-patch-jsondiffpatch
```

## API

### `applyLiveQueryJSONDiffPatchGenerator`

Wrap a `execute` result and apply a live query patch generator middleware.

```ts
import { execute } from "graphql";
import { applyLiveQueryJSONDiffPatchGenerator } from "@n1ru4l/graphql-live-query-patch-jsondiffpatch";
import { schema } from "./schema";

const result = applyLiveQueryJSONDiffPatchGenerator(
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
  })
);
```

### `applyLiveQueryJSONDiffPatch`

Inflate the execution patch results on the client side.

```ts
import { applyLiveQueryJSONDiffPatch } from "@n1ru4l/graphql-live-query-patch-jsondiffpatch";

const asyncIterable = applyLiveQueryJSONDiffPatch(
  // networkLayer.execute returns an AsyncIterable
  networkLayer.execute({
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
);
```

AsyncIterators make composing async logic super easy. In case your GraphQL transport does not return a AsyncIterator you can use the [`@n1ru4l/push-pull-async-iterable-iterator`](https://www.npmjs.com/package/@n1ru4l/push-pull-async-iterable-iterator) package for wrapping the result as a AsyncIterator.

```ts
import { applyLiveQueryJSONDiffPatch } from "@n1ru4l/graphql-live-query-patch-jsondiffpatch";
import { makeAsyncIterableIteratorFromSink } from "@n1ru4l/push-pull-async-iterable-iterator";
import { createClient } from "graphql-ws/lib/use/ws";

const client = createClient({
  url: "ws://localhost:3000/graphql",
});

const asyncIterableIterator = makeAsyncIterableIteratorFromSink((sink) => {
  const dispose = client.subscribe(
    {
      query: "query @live { hello }",
    },
    {
      next: sink.next,
      error: sink.error,
      complete: sink.complete,
    }
  );
  return () => dispose();
});

const wrappedAsyncIterableIterator = applyLiveQueryJSONDiffPatch(
  asyncIterableIterator
);

for await (const value of asyncIterableIterator) {
  console.log(value);
}
```

### `applyLiveQueryJSONDiffPatch`

In most cases using `createApplyLiveQueryPatchGenerator` is the best solution. However, some special implementations might need a more flexible and direct way of applying the patch middleware.

```ts
import { execute } from "graphql";
import { applyLiveQueryJSONDiffPatch } from "@n1ru4l/graphql-live-query-patch-jsondiffpatch";
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
    for (const value of applyLiveQueryJSONDiffPatch(result)) {
      console.log(value);
    }
  }
});
```
