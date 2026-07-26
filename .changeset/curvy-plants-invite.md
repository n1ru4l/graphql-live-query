---
"@n1ru4l/in-memory-live-query-store": patch
---

Export `LiveExecuteReturnType` type from the package entrypoint. It was previously missing the `export` keyword, making it inaccessible to consumers despite being part of the public API (the return type of `execute`/`makeExecute`).
