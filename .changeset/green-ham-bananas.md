---
"@n1ru4l/in-memory-live-query-store": minor
---

BREAKING: Remove support for legacy multi-argument `execute` calls. From now on you should always call `execute` with a single object instead (e.g. `execute({ schema, document })` instead of `execute(schema, document)`).

DEPRECATE: The `InMemoryLiveQueryStore.execute` API has been deprecated. Please use the `InMemoryLiveQueryStore.makeExecute` function instead. Also the `InMemoryLiveQueryStore` constructor parameter option `execute` has been deprecated.
