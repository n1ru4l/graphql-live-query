# GraphQL Live Queries

Proof of concept implementation of GraphQL Live Queries.

## Motivation

There is no live query implementation that is not tied to a specific database out there (or at least I did not see any). This implementation serves as an example how it could be done without being tied to any database.

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

A live query will is sent to the server (via WebSocket or HTTP) and stored there until the client disconnects or notifies the server he is no longer interested in that specific data.

On the server the query is re-executed once the data associated with on of the top level query selections is affected and then sent back to the client.

This raises two questions:

### 1. How does the server know the underlying data has changed?

The store that holds the live queries must be notified.

Practical example:

```js
// somewhere inside a mutation resolver
await db.users.push(createNewUser());
// all live queries that select Query.users must be updated.
liveQueryStore.triggerUpdate("Query.users");
```

### 3. How are the updates sent to the client

The transport layer can be anything that transports data. The examples in this repository use socket.io which sends data over websockets but also comes with a fallback over http polling per default.

Most GraphQL clients (even GraphiQL) have support for Observable data structures which are perfect for describing both Subscription and Live Queries. Ideally a GraphQL Live Query implementation uses a Observable for pushing the latest query data to the client framework that consumes the data.

In addition to that further optimizations could be achieved. E.g. the LiveQueryStore could only send patches to the client which he applied to the initial query result or clients that select the same data in queries could be merged so that the query must be only executed once when the underlying data changes.

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
