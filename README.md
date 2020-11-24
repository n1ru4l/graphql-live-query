<p align="center">
  <img src="assets/logo.svg" width="450" alt="GraphQL Live Query" />
   <br />
  <p align="center">
  Real-Time with GraphQL for any GraphQL schema or transport.
  </p>
  <p align="center">
    <a href="https://dev.to/n1ru4l/graphql-live-queries-with-socket-io-4mh6">Read the blog post</a>
    - <a href="https://dev.to/n1ru4l/collecting-graphql-live-query-resource-identifier-with-graphql-tools-5fm5">Learn how operations are tracked</a>
  </p>
  <br />
  <br />
</p>

## Packages in this Repository

| Package                                                                     | Description                                      | Stats                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`@n1ru4l/in-memory-live-query-store`](packages/in-memory-live-query-store) | Live query implementation.                       | [![npm version](https://img.shields.io/npm/v/@n1ru4l/in-memory-live-query-store.svg)](https://www.npmjs.com/package/@n1ru4l/in-memory-live-query-store) [![npm downloads](https://img.shields.io/npm/dm/@n1ru4l/in-memory-live-query-store.svg)](https://www.npmjs.com/package/@n1ru4l/in-memory-live-query-store) |
| [`@n1ru4l/graphql-live-query`](packages/graphql-live-query)                 | Utilities for live query implementations.        | [![npm version](https://img.shields.io/npm/v/@n1ru4l/graphql-live-query.svg)](https://www.npmjs.com/package/@n1ru4l/graphql-live-query) [![npm downloads](https://img.shields.io/npm/dm/@n1ru4l/graphql-live-query.svg)](https://www.npmjs.com/package/@n1ru4l/graphql-live-query)                                 |
| [`@n1ru4l/graphql-live-query-patch`](packages/graphql-live-query-patch)     | Reduce live query payload size with JSON patches | [![npm version](https://img.shields.io/npm/v/@n1ru4l/graphql-live-query-patch.svg)](https://www.npmjs.com/package/@n1ru4l/graphql-live-query-patch) [![npm downloads](https://img.shields.io/npm/dm/@n1ru4l/graphql-live-query-patch.svg)](https://www.npmjs.com/package/@n1ru4l/graphql-live-query-patch)         |
| [`todo-example-app`](packages/todo-example)                                 | Todo App with state sync across clients.         |
| [`@n1ru4l/socket-io-graphql-server`](packages/socket-io-graphql-server)     | GraphQL over Socket.io - Server Middleware       | [![npm version](https://img.shields.io/npm/v/@n1ru4l/socket-io-graphql-server.svg)](https://www.npmjs.com/package/@n1ru4l/socket-io-graphql-server) [![npm downloads](https://img.shields.io/npm/dm/@n1ru4l/socket-io-graphql-server.svg)](https://www.npmjs.com/package/@n1ru4l/socket-io-graphql-server)         |
| [`@n1ru4l/socket-io-graphql-client`](packages/socket-io-graphql-client)     | GraphQL over Socket.io - Client                  | [![npm version](https://img.shields.io/npm/v/@n1ru4l/socket-io-graphql-client.svg)](https://www.npmjs.com/package/@n1ru4l/socket-io-graphql-client) [![npm downloads](https://img.shields.io/npm/dm/@n1ru4l/socket-io-graphql-client.svg)](https://www.npmjs.com/package/@n1ru4l/socket-io-graphql-client)         |
| [`todo-example-app`](packages/todo-example)                                 | Todo App with state sync across clients.         | -                                                                                                                                                                                                                                                                                                                  |

## Motivation

There are no mature live query implementation that are not tied to any specific database or SaaS product. This implementation should serve as an example how live queries can be added to any schema with (almost) any GraphQL transport.

GraphQL already has a solution for real-time: Subscriptions. Those are the right tool for responding to events. E.g. triggering a sound or showing a toast message once a new message has been received. Subscriptions are also often used for updating existing query results on the client. Depending on the complexity cache update code can eventually become pretty bloated. Often it is more straight-forward to simply refetch the query once a subscription event is received.

In contrast live queries should feel magically and update the UI with the latest data from the server without having to write any cache update wizardry code on the client.

## Concept

A live query is a query operation that is annotated with a `@live` directive.

```gql
query users @live {
  users(first: 10) {
    id
    login
  }
}
```

A live query is sent to the server (via a transport that supports delivering partial execution results) and registered.
The client receives a immediate execution result and furthermore receives additional (partial) execution results once the live query operation was invalidated and therefore the client data became stale.

The client can inform the server that it is no longer interested in the query (unsubscribe the live query operation).

On the server we have a live query invalidation mechanism that is used for determining which queries have become stale, and thus need to be rescheduled for execution. In the future we might event be able to only re-execute partial subtrees of a query operation.

### How does the server know the underlying data has changed?

The reference live query store implementation must be notified once a resource becomes stale.

A resource (in terms of the reference implementation) is described by a root query field schema coordinate (such as `Query.viewer` or `Query.users`),
but also by a resource identifier (such as `User:1`). The latter is by default composed out of the resource typename and the non nullable id field of the given GraphQL type.

For the following type:

```graphql
type User {
  id: ID!
  name: String!
}
```

A legitimate resource identifier would be `User:1`, `User:2`, `User:dfsg12`. Where the string after the first colon describes the id of the resource.

Practical example:

```js
// somewhere inside a mutation resolver
await db.users.push(createNewUser());
// all live queries that select Query.users are invalidated and scheduled for re-execution.
liveQueryStore.invalidate("Query.users");
```

### How are the updates sent/applied to the client

The transport layer can be any transport that allows sending partial execution results to the client.

Most GraphQL clients (including GraphiQL) have support for Observable data structures which are perfect for describing both Subscription and Live Queries. Ideally a GraphQL Live Query implementation uses a Observable for pushing the latest query data to the client framework that consumes the data.

Inside this mono-repository there is Socket.io GraphQL transport that uses WebSockets and HTTP polling.

Further optimizations could be achieved. E.g. the LiveQueryStore could only send patches to the client which should be applied to the initial query result or clients that have the same selection set could be merged so that the query must be only executed once when the underlying data changes.

A distributed backend with many clients could leverage a query store that relies on redis etc.

### List of compatible transports/servers

List of known and tested compatible transports/servers. The order is alphabetical.

| Package                                                                                                                          | Transport                                                                                   | Version                                                                                                                                                                         | Downloads                                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`@n1ru4l/socket-io-graphql-server`](https://github.com/n1ru4l/graphql-live-queries/blob/main/packages/socket-io-graphql-server) | GraphQL over Socket.io (WebSocket/HTTP Long Polling)                                        | [![npm version](https://badge.fury.io/js/%40n1ru4l%2Fsocket-io-graphql-server.svg)](https://github.com/n1ru4l/graphql-live-queries/blob/main/packages/socket-io-graphql-server) | [![npm downloads](https://img.shields.io/npm/dm/@n1ru4l/socket-io-graphql-server.svg)](https://github.com/n1ru4l/graphql-live-queries/blob/main/packages/socket-io-graphql-server) |
| [`graphql-helix`](https://github.com/danielrearden/graphql-helix)                                                                | [GraphQL over HTTP](https://github.com/graphql/graphql-over-http) (IncrementalDelivery/SSE) | [![npm version](https://badge.fury.io/js/graphql-helix.svg)](https://github.com/danielrearden/graphql-helix)                                                                    | [![npm downloads](https://img.shields.io/npm/dm/graphql-helix.svg)](https://github.com/danielrearden/graphql-helix)                                                                |
| [`graphql-ws`](https://github.com/enisdenjo/graphql-ws)                                                                          | [GraphQL over WebSocket](https://github.com/graphql/graphql-over-http/pull/140)             | [![npm version](https://badge.fury.io/js/graphql-ws.svg)](https://github.com/enisdenjo/graphql-ws)                                                                              | [![npm downloads](https://img.shields.io/npm/dm/graphql-ws.svg)](https://github.com/enisdenjo/graphql-ws)                                                                          |
