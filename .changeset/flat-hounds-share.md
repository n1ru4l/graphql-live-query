---
"@n1ru4l/in-memory-live-query-store": patch
---

Do not change the context inside the live query executor, and use WeakMap to map the actual context to the live query context
