# @n1ru4l/socket-io-graphql-client

## 0.10.0

### Minor Changes

- 8e14fd2: improve ESM support by using export fields and .mjs file extensions

## 0.9.5

### Patch Changes

- 456d91e: Fixed race condition where subscriptions would be duplicated if socket connection was interrupted during initial subscription transmission

## 0.9.4

### Patch Changes

- 916de62: fix: bump upstream issue in @n1ru4l/push-pull-async-iterable-iterator

## 0.9.3

### Patch Changes

- c552e69: fix: ensure unsubscribe action is only sent once.

## 0.9.1

### Patch Changes

- 6915f6d: fix support safari 14

## 0.9.0

### Minor Changes

- df4f39b: Return AsyncIterableIterator for the execution result instead of taking a sink as an argument.

### Patch Changes

- df4f39b: Correctly re-execute active operations after being offline.

## 0.8.0

### Minor Changes

- 10a110e: Update Socket.io to version 3

## 0.7.0

### Minor Changes

- 3864577: Instead of returning an Observable a Sink must now be passed as the second parameter for the execute function.

## 0.6.0

### Minor Changes

- f1b7a18: Replace `executeLiveQuery` with `execute`.

  Instead of passing two execute functions to the server options, now only a single execute function is passed to the server.

  The `execute` function can now return a `AsyncIterableIterator<ExecutionResult>`.

  `@n1ru4l/socket-io-graphql-server` has no longer a dependency upon `@n1ru4l/graphql-live-query`.

## 0.5.0

### Minor Changes

- b086fc8: Shape the API to be more "compatible" with graphql-js.

  **BREAKING CHANG** Rename `InMemoryLiveQueryStore.triggerUpdate` method to `InMemoryLiveQueryStore.invalidate`. `InMemoryLiveQueryStore.invalidate` now also accepts an array of strings.

  **BREAKING CHANGE** `InMemoryLiveQueryStore` no longer implements `LiveQueryStore`. The `LiveQueryStore` interface was removed

  **BREAKING CHANGE** Rename `InMemoryLiveQueryStore.register` to `InMemoryLiveQueryStore.execute`. `InMemoryLiveQueryStore.execute` returns a `AsyncIterableIterator` which publishes the execution results.

## 0.4.0

### Minor Changes

- bb822cd: The client now also sends the operationName to the server if provided. The `operationName` is now also optional.

## 0.1.0

### Minor Changes

- aa2be73: chore: unify how packages are built.
