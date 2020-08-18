---
"@n1ru4l/socket-io-graphql-server": minor
---

Allow lazy registration of the GraphQL layer on a socket basis. This is useful for use-cases where authentication must be done BEFORE any GraphQL operations could be executed.

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
  });
});
```
