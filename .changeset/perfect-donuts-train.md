---
"@n1ru4l/socket-io-graphql-client": patch
---

Fixed race condition where subscriptions would be duplicated if socket connection was interrupted during initial subscription transmission
