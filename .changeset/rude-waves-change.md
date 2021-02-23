---
"@n1ru4l/in-memory-live-query-store": patch
---

Add `includeIdentifierExtension` option for InMemoryLiveQueryStore constructor.

Setting the `includeIdentifierExtension` option to `true` will result in all the topics valid for a operation being added as a extensions field to the operation result.

The option is set to `true` by default if `process.env.NODE_ENV === "development"`.

```json
{
  "data": {
    "post": {
      "id": "1",
      "title": "lel"
    }
  },
  "extensions": {
    "liveResourceIdentifier": ["Query.post", "Query.post(id:\"1\")", "Post:1"]
  },
  "isLive": true
}
```
