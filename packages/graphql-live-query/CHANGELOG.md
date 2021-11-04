# @n1ru4l/graphql-live-query

## 0.9.0

### Minor Changes

- f555f2f: GraphQL v16 compatibility

## 0.8.2

### Patch Changes

- 31ef74b: fix esm support for create-react-app and webpack

## 0.8.1

### Patch Changes

- fbbee22: re-add `isLiveQueryOperationDefinitionNode` function

## 0.8.0

### Minor Changes

- e893ecc: Add `throttle` argument for the `@live` directive for negotiating a throttle between the server and the client. This is useful for preventing the server to spam the client for data that might be updating too frequently.
- 8e14fd2: improve ESM support by using export fields and .mjs file extensions

## 0.7.1

### Patch Changes

- 88270dc: feat: allow conditional live queries via the if argument on the live directive

## 0.7.0

### Minor Changes

- f244baa: Add `NoLiveMixedWithDeferStreamRule` rule.

### Patch Changes

- ca21161: Mark live query execution results via the boolean isLive property published by the AsyncIterator. This makes identifying live queries easier. A possible use-case where this is useful might be a wrapper around InMemoryLiveQueryStore.execute that creates patches from the last and next execution result."

## 0.6.0

### Minor Changes

- 7b37628: Remove exported `extractLiveQueries` function.

### Patch Changes

- 37f0b6d: rename `isLiveOperationDefinition` to `isLiveQueryOperationDefinitionNode`

## 0.5.0

### Minor Changes

- 6cfe3e5: Replace `executeLiveQuery` with `execute`.

  Instead of passing two execute functions to the server options, now only a single execute function is passed to the server.

  The `execute` function can now return a `AsyncIterableIterator<ExecutionResult>`.

  `@n1ru4l/socket-io-graphql-server` has no longer a dependency upon `@n1ru4l/graphql-live-query`.

## 0.4.0

### Minor Changes

- b086fc8: Shape the API to be more "compatible" with graphql-js.

  **BREAKING CHANG** Rename `InMemoryLiveQueryStore.triggerUpdate` method to `InMemoryLiveQueryStore.invalidate`. `InMemoryLiveQueryStore.invalidate` now also accepts an array of strings.

  **BREAKING CHANGE** `InMemoryLiveQueryStore` no longer implements `LiveQueryStore`. The `LiveQueryStore` interface was removed

  **BREAKING CHANGE** Rename `InMemoryLiveQueryStore.register` to `InMemoryLiveQueryStore.execute`. `InMemoryLiveQueryStore.execute` returns a `AsyncIterableIterator` which publishes the execution results.

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

## 0.2.0

### Minor Changes

- aa2be73: chore: unify how packages are built.
