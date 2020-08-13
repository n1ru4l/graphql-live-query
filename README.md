# GraphQL Live Queries

Proof of concept implementation of GraphQL Live Queries.

## Motivation

There is no live query implementation that is not tied to a specific database out there (or at least I did not see any). This implementation serves as an example how it could be done without being tied to any database.

GraphQL already has a solution for real-time: Subscriptions. Subscriptions are the right tool for responding to events. An example for this would be triggering a sound or showing a toast message once a new message has been received. Subscriptions are also often used for updating existing query results on the client. Depending on the complexity cache update code can eventually become pretty bloated. Often it is more straight-forward to simply refetch the query once a subscription event is received.

Live queries however should feel magically and update the UI with the latest data from the server without having to do some cache update wizardry.

## Concept

The current definition of a live query for this project is a query operation that is annotated with a `@live` directive.

```gql
query users @live {
  users(first: 10) {
    id
    login
  }
}
```

A live query is sent to the server (via WebSocket or HTTP) and stored there until the client disconnects or notifies the server he is no longer interested in the query (and hence the server disposing it).

On the server the query is re-executed once the data associated with at least one of the top level query selections is affected and then sent back to the client.

This raises two questions:

### 1. How does the server know the underlying data has changed?

The store that holds the live queries must be notified once the underyling data changes.

Practical example:

```js
// somewhere inside a mutation resolver
await db.users.push(createNewUser());
// all live queries that select Query.users must be updated.
liveQueryStore.triggerUpdate("Query.users");
```

### 2. How are the updates sent/applied to the client

The transport layer can be anything that transports data from the server to the client (most likely a browser). The examples in this repository use socket.io which sends data over websockets but also comes with a fallback over http polling per default.

Most GraphQL clients (even GraphiQL) have support for Observable data structures which are perfect for describing both Subscription and Live Queries. Ideally a GraphQL Live Query implementation uses a Observable for pushing the latest query data to the client framework that consumes the data.

In addition to that further optimizations could be achieved. E.g. the LiveQueryStore could only send patches to the client which should be applied to the initial query result or clients that have the same selection set could be merged so that the query must be only executed once when the underlying data changes. A distributed backend with many clients could leverage a query store that relies on redis etc.

## Implementation

- [x] [`@n1ru4l/graphql-live-queries`](packages/graphql-live-query) - Basic utilities for determining live queries
- [x] [`@n1ru4l/graphql-live-query-simple-store`](packages/simple-query-store) - A simple query store that holds the queries in memory
- [ ] [`example-app`](packages/example) - A simple chat app that uses socket.io as a GraphQL transportation layer.

## Setup

```
yarn install
yarn workspaces run build
yarn workspace example-app start
# visit localhost:3000/graphql in browser
```
