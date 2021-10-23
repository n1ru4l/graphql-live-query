# @n1ru4l/socket-io-graphql-server

## 0.11.0

### Minor Changes

- c2dee5a: Support sending extensions from the client to the server.

  ```ts
  client.execute({
    operation,
    extensions: {
      secret: "I like turtles!"
    }
  });
  ```

  The GraphQL over HTTP specification allows to send a extensions object as part of a GraphQL request to the server. This is now also supported. Possible use-cases might be [access tokens](https://github.com/n1ru4l/graphql-live-query/discussions/735) or protocol extensions such as [Automatic Persisted Queries](https://github.com/apollographql/apollo-link-persisted-queries#protocol).

## 0.10.0

### Minor Changes

- 8e14fd2: improve ESM support by using export fields and .mjs file extensions

## 0.9.2

### Patch Changes

- 5ca93e3: correctly detect the main operation of the sent graphqll document

## 0.9.0

### Minor Changes

- df4f39b: Return AsyncIterableIterator for the execution result instead of taking a sink as an argument.

## 0.8.1

### Patch Changes

- 24028bf: feat: add validationRules option for overwriting validationRules without overwriting validate.

## 0.8.0

### Minor Changes

- 10a110e: Update Socket.io to version 3

## 0.7.0

### Minor Changes

- 7b37628: Remove support for the `onError` handler.
- 7b37628: Accept `DocumentNode` objects as the execution input.

### Patch Changes

- 8d416b8: make graphql a peer dependency
- 7b37628: Make implementation more conform with how `graphql-express` behaves.

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

### Patch Changes

- Updated dependencies [b086fc8]
  - @n1ru4l/graphql-live-query@0.4.0

## 0.4.0

### Minor Changes

- bb822cd: The client now also sends the operationName to the server if provided. The `operationName` is now also optional.

## 0.3.0

### Minor Changes

- dda2325: accept an empty variables value as the payload.
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

- 66b9261: Allow lazy registration of the GraphQL layer on a socket basis. This is useful for use-cases where authentication must be done BEFORE any GraphQL operations could be executed.

  ```tsx
  const socketIOGraphQLServer = registerSocketIOGraphQLServer({
    socketServer,
    isLazy: true
  });

  socketServer.on("connection", socket => {
    socket.on("auth", message => {
      validateAuth(message);
      // allow consuming the GraphQL API if authentication passes.
      const dispose = socketIOGraphQLServer.registerSocket(socket);
      // disable consuming the GraphQL API for the given socket.
      dispose();
      // you could also do the following for disposing instead:
      socketIOGraphQLServer.disposeSocket(socket);
    });
  });
  ```

## 0.1.0

### Minor Changes

- aa2be73: chore: unify how packages are built.

### Patch Changes

- Updated dependencies [aa2be73]
  - @n1ru4l/graphql-live-query@0.2.0
