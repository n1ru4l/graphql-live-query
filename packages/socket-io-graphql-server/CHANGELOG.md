# @n1ru4l/socket-io-graphql-server

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
