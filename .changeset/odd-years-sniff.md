---
"@n1ru4l/in-memory-live-query-store": patch
---

use the correct `execute` function for executing live queries.

When using the `InMemoryLiveQueryStore.makeExecute` API the returned function did not properly use the provided `execute` function. Instead the `execute` function provided to the `InMemoryLiveQueryStore` constructor was used. This issue caused unexpected behavior when using this library with envelop.
