import {
  execute as defaultExecuteImplementation,
  ExecutionArgs,
  parse,
  specifiedRules,
  validate,
} from "@graphql-tools/graphql";
import { useServer } from "graphql-ws/lib/use/ws";
import { InMemoryLiveQueryStore } from "@n1ru4l/in-memory-live-query-store";
import { NoLiveMixedWithDeferStreamRule } from "@n1ru4l/graphql-live-query";
import { applyLiveQueryJSONDiffPatchGenerator } from "@n1ru4l/graphql-live-query-patch-jsondiffpatch";
import { Server, WebSocket } from "ws";
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

export const createServer = async ({ port = 3001 }: { port?: number }) => {
  const liveQueryStore = new InMemoryLiveQueryStore();
  const rootValue = {
    todos: new Map(),
  };
  const contextValue = {
    liveQueryStore,
  };

  rootValue.todos.set("1", {
    id: "1",
    content: "foo",
    isCompleted: false,
  });

  const wsServer = new Server({
    port,
    path: "/graphql",
  });

  const execute = flow(
    liveQueryStore.makeExecute(defaultExecuteImplementation),
    applyLiveQueryJSONDiffPatchGenerator
  );

  useServer(
    {
      schema,
      execute,
      onSubscribe: (_, msg) => {
        const args: ExecutionArgs = {
          schema,
          operationName: msg.payload.operationName,
          document: parse(msg.payload.query),
          variableValues: msg.payload.variables,
          contextValue,
          rootValue,
        };

        const errors = validate(args.schema, args.document, [
          ...specifiedRules,
          NoLiveMixedWithDeferStreamRule,
        ]);

        if (errors.length) return errors;

        return args;
      },
    },
    wsServer
  );

  wsServer.on("listening", () => {
    console.log(`GraphQL server is running on port ${port}.`);
  });

  // Graceful shutdown stuff :)
  // Ensure connections are closed when shutting down is received
  const connections = new Set<WebSocket>();
  wsServer.on("connection", (connection) => {
    connections.add(connection);
    connection.on("close", () => {
      connections.delete(connection);
    });
  });

  return async () => {
    await new Promise<void>((resolve, reject) => {
      wsServer.close((err) => {
        if (err) return reject(err);
        resolve();
      });
      for (const connection of connections) {
        connection.close();
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
