---
"@n1ru4l/graphql-live-query": minor
"@n1ru4l/in-memory-live-query-store": minor
"@n1ru4l/socket-io-graphql-server": minor
---

**BREAKING CHANGE**: Change API of `LiveQueryStore`.

The register method of the `LiveQueryStore` now has changed:

```ts
import type { DocumentNode, ExecutionResult } from "graphql";

export type UnsubscribeHandler = () => void;
export type OperationVariables = { [key: string]: any } | null | undefined;

export abstract class LiveQueryStore {
  abstract async triggerUpdate(identifier: string): Promise<void>;
  abstract register(
    operationDocument: DocumentNode,
    operationVariables: OperationVariables,
    executeQuery: () => Promise<ExecutionResult>,
    publishUpdate: (executionResult: ExecutionResult, payload: any) => void
  ): UnsubscribeHandler;
}
```
