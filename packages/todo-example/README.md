# TodoMVC Example App

This directory contains a GraphQL server for a TODO app with full live query support.
That means all changes to the TODO list are immediately synced across all schema consumers.

The backend is written with "plain" `graphql-js` and without persistent storage. It is super lightweight and only has around ~300 lines of code.

There are three frontend implementations available that use the most widely adopted React GraphQL clients.

All the "frontends" use `create-react-app` as the base.

- Relay
- Apollo Client
- Urql

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
