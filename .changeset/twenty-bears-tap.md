---
"@n1ru4l/in-memory-live-query-store": patch
---

Fix `extractLiveQueryRootFieldCoordinates` to handle `FieldNode`s without an `arguments` array instead of relying on optional chaining alone to support graphql-js 17
