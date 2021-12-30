---
"@n1ru4l/in-memory-live-query-store": minor
---

The source returned from execute is now lazy and will only start emitting values once it is consumed. This prevents memory leaks.

**BREAKING**: If the wrapped `execute` function returns a stream (e.g. because you forgot to add the `NoLiveMixedWithDeferStreamRule` validation rule) it causes the `execute` function to reject instead of publishing a ExecutionResult error payload. This change has been made in order to treat the error as unexpected and not leak any implementation details to the clients.
