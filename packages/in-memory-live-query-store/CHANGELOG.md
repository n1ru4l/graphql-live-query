# @n1ru4l/in-memory-live-query-store

## 0.5.3

### Patch Changes

- ca21161: Mark live query execution results via the boolean isLive property published by the AsyncIterator. This makes identifying live queries easier. A possible use-case where this is useful might be a wrapper around InMemoryLiveQueryStore.execute that creates patches from the last and next execution result."
- Updated dependencies [ca21161]
- Updated dependencies [f244baa]
  - @n1ru4l/graphql-live-query@0.7.0

## 0.5.2

### Patch Changes

- 8d416b8: make graphql a peer dependency
- 7b37628: Make implementation more compatible with how `graphql-js` behaves.
- c550c40: fix: Don't leak implementation details on the returned AsyncIterableIterator. `InMemoryLiveQueryStore.execute` noe resolves with a generic AsyncIterableIterator.
- Updated dependencies [37f0b6d]
- Updated dependencies [7b37628]
  - @n1ru4l/graphql-live-query@0.6.0

## 0.5.1

### Patch Changes

- c14836a: Fix memory leak cause by not correctly disposing live query records once a live query has finished.

## 0.5.0

### Minor Changes

- 6cfe3e5: Replace `executeLiveQuery` with `execute`.

  Instead of passing two execute functions to the server options, now only a single execute function is passed to the server.

  The `execute` function can now return a `AsyncIterableIterator<ExecutionResult>`.

  `@n1ru4l/socket-io-graphql-server` has no longer a dependency upon `@n1ru4l/graphql-live-query`.

### Patch Changes

- Updated dependencies [6cfe3e5]
  - @n1ru4l/graphql-live-query@0.5.0

## 0.4.0

### Minor Changes

- b086fc8: Shape the API to be more "compatible" with graphql-js.

  **BREAKING CHANG** Rename `InMemoryLiveQueryStore.triggerUpdate` method to `InMemoryLiveQueryStore.invalidate`. `InMemoryLiveQueryStore.invalidate` now also accepts an array of strings.

  **BREAKING CHANGE** `InMemoryLiveQueryStore` no longer implements `LiveQueryStore`. The `LiveQueryStore` interface was removed

  **BREAKING CHANGE** Rename `InMemoryLiveQueryStore.register` to `InMemoryLiveQueryStore.execute`. `InMemoryLiveQueryStore.execute` returns a `AsyncIterableIterator` which publishes the execution results.

### Patch Changes

- Updated dependencies [b086fc8]
  - @n1ru4l/graphql-live-query@0.4.0

## 0.3.0

### Minor Changes

- 6a03905: **BREAKING CHANGE**: Change API of `LiveQueryStore`.

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

### Patch Changes

- Updated dependencies [6a03905]
  - @n1ru4l/graphql-live-query@0.3.0

## 0.2.0

### Minor Changes

- aa2be73: chore: unify how packages are built.

### Patch Changes

- Updated dependencies [aa2be73]
  - @n1ru4l/graphql-live-query@0.2.0
