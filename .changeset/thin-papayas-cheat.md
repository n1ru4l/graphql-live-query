---
"@n1ru4l/graphql-live-query": minor
"@n1ru4l/in-memory-live-query-store": minor
"@n1ru4l/socket-io-graphql-server": minor
---

**BREAKING CHANGE** The API of `LiveQueryStore`.

The `extractLiveQueryRootIdentifier` function was moved from `@n1ru4l/graphql-live-query` to `@n1ru4l/in-memory-live-query-store`, as it is an implementation detail of the `InMemoryLiveQueryStore`. The implementation could differ based on different store implementations. The function `extractLiveQueryRootIdentifier` is also no longer public.

The `InMemoryLiveQueryStore` can now also process query operations that use `Fragments` and `InlineFragments` on the `RootQueryType`.

The `operationName` is now also passed to the `LiveQueryStore.register` method.

```ts
import type { DocumentNode, ExecutionResult } from "graphql";

export type UnsubscribeHandler = () => void;
export type OperationVariables = { [key: string]: any } | null | undefined;

export abstract class LiveQueryStore {
  abstract async triggerUpdate(identifier: string): Promise<void>;
  abstract register(
    operationDocument: DocumentNode,
    operationName: string | null,
    operationVariables: OperationVariables,
    executeQuery: () => Promise<ExecutionResult>,
    publishUpdate: (executionResult: ExecutionResult, payload: any) => void
  ): UnsubscribeHandler;
}
```
