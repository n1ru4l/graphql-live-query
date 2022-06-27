import * as client from "@n1ru4l/socket-io-graphql-client";
import * as io from "socket.io";
import * as ioClient from "socket.io-client";
import * as http from "http";
import { makeExecutableSchema } from "@graphql-tools/schema";
import * as server from "../src/index.js";

const schema = makeExecutableSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      query: Boolean
    }

    type Mutation {
      mutation: Boolean
      echo(say: String!): String!
    }
  `,
  resolvers: {
    Mutation: {
      echo: (_, { say }) => say,
    },
  },
});

const port = 4329;
const host = `http://localhost:${port}`;

const httpServer = http.createServer();
let ioServer: io.Server;
let ioSocket: ioClient.Socket | undefined;

let socketServer: server.SocketIOGraphQLServer | undefined;
let socketClient: client.SocketIOGraphQLClient | undefined;

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    httpServer.listen(port, resolve);
  });
  ioServer = new io.Server(httpServer);
});

afterEach(async () => {
  if (socketServer) {
    socketServer.destroy();
    socketServer = undefined;
  }
  if (socketClient) {
    socketClient.destroy();
    socketClient = undefined;
  }
  if (ioSocket) {
    ioSocket.close();
    ioSocket = undefined;
  }
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    httpServer.close((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
});

it("can execute simple query operation", async () => {
  socketServer = server.registerSocketIOGraphQLServer({
    socketServer: ioServer,
    getParameter: () => ({ graphQLExecutionParameter: { schema } }),
  });

  ioSocket = ioClient.io(host);
  socketClient = client.createSocketIOGraphQLClient(ioSocket);

  const result = await socketClient
    .execute({
      operation: /* GraphQL */ `
        query {
          query
        }
      `,
    })
    .next();

  expect(result.value).toStrictEqual({
    data: {
      query: null,
    },
  });
});

it("can execute simple mutation operation", async () => {
  socketServer = server.registerSocketIOGraphQLServer({
    socketServer: ioServer,
    getParameter: () => ({ graphQLExecutionParameter: { schema } }),
  });

  ioSocket = ioClient.io(host);
  socketClient = client.createSocketIOGraphQLClient(ioSocket);

  const result = await socketClient
    .execute({
      operation: /* GraphQL */ `
        mutation {
          mutation
        }
      `,
    })
    .next();

  expect(result.value).toStrictEqual({
    data: {
      mutation: null,
    },
  });
});

it("can provide variables for a operation document", async () => {
  socketServer = server.registerSocketIOGraphQLServer({
    socketServer: ioServer,
    getParameter: () => ({ graphQLExecutionParameter: { schema } }),
  });

  ioSocket = ioClient.io(host);
  socketClient = client.createSocketIOGraphQLClient(ioSocket);

  const result = await socketClient
    .execute({
      operation: /* GraphQL */ `
        mutation ($mantra: String!) {
          echo(say: $mantra)
        }
      `,
      variables: {
        mantra: "Dicken Bubatz mit den Jungs schallern.",
      },
    })
    .next();

  expect(result.value).toStrictEqual({
    data: {
      echo: "Dicken Bubatz mit den Jungs schallern.",
    },
  });
});

it("operationName is used for picking the operation within a document of multiple operations that should be executed", async () => {
  socketServer = server.registerSocketIOGraphQLServer({
    socketServer: ioServer,
    getParameter: () => ({ graphQLExecutionParameter: { schema } }),
  });

  ioSocket = ioClient.io(host);
  socketClient = client.createSocketIOGraphQLClient(ioSocket);

  const operation = /* GraphQL */ `
    mutation A {
      mutation
    }
    query B {
      query
    }
  `;

  let result = await socketClient
    .execute({
      operation,
      operationName: "A",
    })
    .next();

  expect(result.value).toStrictEqual({
    data: {
      mutation: null,
    },
  });

  result = await socketClient
    .execute({
      operation,
      operationName: "B",
    })
    .next();

  expect(result.value).toStrictEqual({
    data: {
      query: null,
    },
  });
});

it("extensions sent from the client are forwarded to the server handler", async () => {
  socketServer = server.registerSocketIOGraphQLServer({
    socketServer: ioServer,
    getParameter: ({ graphQLPayload }) => {
      expect(graphQLPayload.extensions).toEqual({
        secret: "I like turtles!",
      });

      return { graphQLExecutionParameter: { schema } };
    },
  });

  ioSocket = ioClient.io(host);
  socketClient = client.createSocketIOGraphQLClient(ioSocket);

  const operation = /* GraphQL */ `
    mutation A {
      mutation
    }
  `;

  await socketClient
    .execute({
      operation,
      extensions: {
        secret: "I like turtles!",
      },
    })
    .next();
});
