# TodoMVC Example App

This directory contains a GraphQL server for a TODO app with full live query support.
That means all changes to the TODO list are immediately synced across all schema consumers.

The backend is written with "plain" `graphql-js` and without persistent storage. It is super lightweight and only has around ~300 lines of code.

The frontend is written using `create-react-app` and `relay`.
