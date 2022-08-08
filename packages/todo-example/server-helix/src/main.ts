import express from "express";
import http from "http";
import cors from "cors";
import {
  specifiedRules,
  execute as defaultExecute,
} from "@graphql-tools/graphql";
import {
  getGraphQLParameters,
  processRequest,
  renderGraphiQL,
  shouldRenderGraphiQL,
} from "graphql-helix";
import { InMemoryLiveQueryStore } from "@n1ru4l/in-memory-live-query-store";
import { NoLiveMixedWithDeferStreamRule } from "@n1ru4l/graphql-live-query";
import { applyLiveQueryJSONDiffPatchGenerator } from "@n1ru4l/graphql-live-query-patch-jsondiffpatch";
import { schema } from "./schema";
import { Socket } from "net";
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

export async function createServer({ port = 3001 }: { port?: number }) {
  const liveQueryStore = new InMemoryLiveQueryStore();
  const execute = flow(
    liveQueryStore.makeExecute(defaultExecute),
    applyLiveQueryJSONDiffPatchGenerator
  );

  const rootValue = {
    todos: new Map(),
  };

  rootValue.todos.set("1", {
    id: "1",
    content: "foo",
    isCompleted: false,
  });

  const app = express();

  app.use(cors());

  app.use(express.json());

  app.use("/", async (req, res) => {
    const request = {
      body: req.body,
      headers: req.headers,
      method: req.method,
      query: req.query,
    };

    if (shouldRenderGraphiQL(request)) {
      res.send(renderGraphiQL());
    } else {
      const { operationName, query, variables } = getGraphQLParameters(request);

      const result = await processRequest({
        operationName,
        query,
        variables,
        request,
        schema,
        validationRules: [...specifiedRules, NoLiveMixedWithDeferStreamRule],
        contextFactory: () => ({
          liveQueryStore,
        }),
        rootValueFactory: () => rootValue,
        execute,
      });

      if (result.type === "RESPONSE") {
        result.headers.forEach(({ name, value }) => res.setHeader(name, value));
        res.status(result.status);
        res.json(result.payload);
      } else if (result.type === "MULTIPART_RESPONSE") {
        res.writeHead(200, {
          Connection: "keep-alive",
          "Content-Type": 'multipart/mixed; boundary="-"',
          "Transfer-Encoding": "chunked",
        });

        req.on("close", () => {
          result.unsubscribe();
        });

        await result.subscribe((result) => {
          const chunk = Buffer.from(JSON.stringify(result), "utf8");
          const data = [
            "",
            "---",
            "Content-Type: application/json; charset=utf-8",
            "Content-Length: " + String(chunk.length),
            "",
            chunk,
            "",
          ].join("\r\n");
          res.write(data);
        });

        res.write("\r\n-----\r\n");
        res.end();
      } else {
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          Connection: "keep-alive",
          "Cache-Control": "no-cache",
        });

        req.on("close", () => {
          result.unsubscribe();
        });

        await result.subscribe((result) => {
          res.write(`data: ${JSON.stringify(result)}\n\n`);
        });
      }
    }
  });

  const server = await new Promise<http.Server>((resolve) => {
    const server = app.listen(port, () => {
      console.log(`GraphQL server is running on port ${port}.`);
      resolve(server);
    });
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
}

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
