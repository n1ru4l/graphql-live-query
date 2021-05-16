# TodoMVC Example App

This directory contains a GraphQL server for a todo app with full live query support.
That means all changes to the todo list are immediately synced across all schema consumers (web clients).

The backend is written with "plain" `graphql-js` and without any persistent storage. It is super lightweight and only has around ~300 lines of code.

There are three frontend implementations available that use the most widely adopted React GraphQL clients.

All the "frontends" use `create-react-app` as the base.

- Relay
- Apollo Client
- Urql

Each of those client apps also has with a GraphiQL IDE.

The clients use the [GraphQL over Socket.io transport](https://github.com/n1ru4l/graphql-live-query/tree/main/packages/socket-io-graphql-server). For other compatible transports like [GraphQL over WebSocket](https://github.com/graphql/graphql-over-http/pull/140) or [GraphQL over HTTP](https://github.com/graphql/graphql-over-http) [(experimental SSE as supported by graphql-helix)](https://github.com/contrawork/graphql-helix) we recommend checking out [GraphQL Bleeding Edge Playground](https://github.com/n1ru4l/graphql-bleeding-edge-playground)

## Setup

Make sure you you have `yarn` installed, this repository uses yarn workspaces!

```bash
git clone https://github.com/n1ru4l/graphql-live-query
cd graphql-live-query
yarn # install at repository root because this is a mono repository!
yarn build # build all live query packages
cd todo-example
```

## Starting the server

```bash
cd server
yarn start
```

## Starting the client

```bash
cd client-relay # or client-apollo or client-urql
yarn start
```

Visit http://localhost:3000
