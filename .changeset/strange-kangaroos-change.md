---
"@n1ru4l/in-memory-live-query-store": minor
---

Allow setting custom invalidation indices.

Until now doing granular or very specific index invalidations wasn't possible. Thus invalidation might not have been efficient enough, as either too many or too few live query operation "subscriptions" got invalidated.

The new `indexBy` configuration option for the `InMemoryLiveQueryStore`, allows configuring specific indices suitable for the consumed GraphQL schema, resulting more granular and efficient invalidations.

**Invalidate by single field with arguments:**

```ts
const store = new InMemoryLiveQueryStore({
  includeIdentifierExtension: true,
  indexBy: [
    {
      field: "Query.posts",
      args: ["needle"],
    },
  ],
});

const execute = store.makeExecute(executeImplementation);

const document = parse(/* GraphQL */ `
  query @live {
    posts(needle: "skrrrrt") {
      id
      title
    }
  }
`);

const executionResult = execute({ document, schema });

let result = await executionResult.next();
expect(result.value).toEqual({
  data: {
    posts: [],
  },
  extensions: {
    liveResourceIdentifier: ["Query.posts", 'Query.posts(needle:"skrrrrt")'],
  },
  isLive: true,
});
```

**Invalidation by single field with specific arguments:**

```ts
const store = new InMemoryLiveQueryStore({
  includeIdentifierExtension: true,
  indexBy: [
    {
      field: "Query.posts",
      // index will only be used if the needle argument value equals "brrrrt"
      args: [["needle", "brrrrt"]],
    },
  ],
});
```
