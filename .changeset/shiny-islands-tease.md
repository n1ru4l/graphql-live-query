---
"@n1ru4l/in-memory-live-query-store": patch
---

fix: Don't leak implementation details on the returned AsyncIterableIterator. `InMemoryLiveQueryStore.execute` noe resolves with a generic AsyncIterableIterator.
