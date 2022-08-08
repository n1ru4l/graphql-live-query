import { Server as IOServer } from "socket.io";
import http from "http";
import type { Socket } from "net";
import { NoLiveMixedWithDeferStreamRule } from "@n1ru4l/graphql-live-query";
import { applyLiveQueryJSONDiffPatchGenerator } from "@n1ru4l/graphql-live-query-patch-jsondiffpatch";
import { InMemoryLiveQueryStore } from "@n1ru4l/in-memory-live-query-store";
import { registerSocketIOGraphQLServer } from "@n1ru4l/socket-io-graphql-server";
import {
  specifiedRules,
  execute as defaultExecute,
} from "@graphql-tools/graphql";
import { schema } from "./schema";
import { flow } from "./util/flow";

const parsePortSafe = (port: null | undefined | string) => {
  if (!port) {
    return null;
  }
  const parsedPort = parseInt(port, 10);
  if (Number.isNaN(parsedPort)) {
    return null;
  }
  return parsedPort;
};

const validationRules = [...specifiedRules, NoLiveMixedWithDeferStreamRule];

export const createServer = async ({ port = 3001 }: { port?: number }) => {
  const server = http.createServer((_, res) => {
    res.writeHead(404);
    res.end();
  });
  await new Promise<http.Server>((resolve) => {
    server.listen(port, () => {
      resolve(server);
    });
  });

  const socketServer = new IOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  const liveQueryStore = new InMemoryLiveQueryStore();

  const rootValue = {
    todos: new Map(),
  };

  rootValue.todos.set("1", {
    id: "1",
    content: "foo",
    isCompleted: false,
  });

  const execute = flow(
    liveQueryStore.makeExecute(defaultExecute),
    applyLiveQueryJSONDiffPatchGenerator
  );

  registerSocketIOGraphQLServer({
    socketServer,
    getParameter: () => ({
      execute,
      // Overwrite validate and use our custom validation rules.
      validationRules,
      graphQLExecutionParameter: {
        schema,
        rootValue,
        contextValue: {
          liveQueryStore,
        },
      },
    }),
  });

  // Graceful shutdown stuff :)
  // Ensure connections are closed when shutting down is received
  const connections = new Set<Socket>();
  server.on("connection", (connection) => {
    connections.add(connection);
    connection.on("close", () => {
      connections.delete(connection);
    });
  });

  return async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) return reject(err);
        resolve();
      });
      for (const connection of connections) {
        connection.destroy();
      }
    });
  };
};

if (require.main === module) {
  let isShuttingDown = false;

  (async () => {
    const port = parsePortSafe(process.env.PORT) ?? 3001;
    const destroy = await createServer({ port });
    console.log("Listening on http://localhost:" + port);

    process.on("SIGINT", () => {
      if (isShuttingDown) {
        return;
      }
      isShuttingDown = true;
      destroy();
    });
  })();
}
