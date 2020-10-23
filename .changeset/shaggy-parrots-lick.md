---
"@n1ru4l/socket-io-graphql-client": minor
"@n1ru4l/socket-io-graphql-server": minor
---

Replace `executeLiveQuery` with `execute`.

Instead of passing two execute functions to the server options, now only a single execute function is passed to the server.

The `execute` function can now return a `AsyncIterableIterator<ExecutionResult>`.

`@n1ru4l/socket-io-graphql-server` has no longer a dependency upon `@n1ru4l/graphql-live-query`.
