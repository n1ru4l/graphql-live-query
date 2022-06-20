---
"@n1ru4l/in-memory-live-query-store": minor
---

Drop the `execute` constructor argument option.
Please use `InMemoryLiveQueryStore.makeExecute` instead.

**Old**

```ts
import { InMemoryLiveQueryStore } from "@n1ru4l/in-memory-live-query-store";
import { execute as executeImplementation } from "graphql";
const liveQueryStore = new InMemoryLiveQueryStore({ execute });
const execute = liveQueryStore.execute;
```

**New**

```ts
import { InMemoryLiveQueryStore } from "@n1ru4l/in-memory-live-query-store";
import { execute as executeImplementation } from "graphql";
const liveQueryStore = new InMemoryLiveQueryStore();
const execute = liveQueryStore.makeExecute(executeImplementation);
```
