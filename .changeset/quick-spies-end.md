---
"@n1ru4l/graphql-live-query": minor
"@n1ru4l/in-memory-live-query-store": minor
"@n1ru4l/socket-io-graphql-server": minor
"@n1ru4l/socket-io-graphql-client": minor
---

Shape the API to be more "compatible" with graphql-js.

**BREAKING CHANG** Rename `InMemoryLiveQueryStore.triggerUpdate` method to `InMemoryLiveQueryStore.invalidate`. `InMemoryLiveQueryStore.invalidate` now also accepts an array of strings.

**BREAKING CHANGE** `InMemoryLiveQueryStore` no longer implements `LiveQueryStore`. The `LiveQueryStore` interface was removed

**BREAKING CHANGE** Rename `InMemoryLiveQueryStore.register` to `InMemoryLiveQueryStore.execute`. `InMemoryLiveQueryStore.execute` returns a `AsyncIterableIterator` which publishes the execution results.
