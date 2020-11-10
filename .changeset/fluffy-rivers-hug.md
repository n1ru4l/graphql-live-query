---
"@n1ru4l/graphql-live-query": patch
"@n1ru4l/in-memory-live-query-store": patch
---

Mark live query execution results via the boolean isLive property published by the AsyncIterator. This makes identifying live queries easier. A possible use-case where this is useful might be a wrapper around InMemoryLiveQueryStore.execute that creates patches from the last and next execution result."
