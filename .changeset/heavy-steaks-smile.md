---
"@n1ru4l/socket-io-graphql-client": minor
"@n1ru4l/socket-io-graphql-server": minor
---

Support sending extensions from the client to the server.

```ts
client.execute({
  operation,
  extensions: {
    secret: "I like turtles!",
  },
});
```

The GraphQL over HTTP specification allows to send a extensions object as part of a GraphQL request to the server. This is now also supported. Possible use-cases might be [access tokens](https://github.com/n1ru4l/graphql-live-query/discussions/735) or protocol extensions such as [Automatic Persisted Queries](https://github.com/apollographql/apollo-link-persisted-queries#protocol).
