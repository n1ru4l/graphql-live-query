---
"@n1ru4l/graphql-live-query-patch": patch
"@n1ru4l/graphql-live-query-patch-jsondiffpatch": patch
"@n1ru4l/graphql-live-query-patch-json-patch": patch
---

BREAKING move `@n1ru4l/graphql-live-query-patch` logic to `@n1ru4l/graphql-live-query-patch-json-patch`. `@n1ru4l/graphql-live-query-patch` now contains generic logic for patch generation. `@n1ru4l/graphql-live-query-patch-jsondiffpatch` implements the more efficient jsondiffpatch algorithm
