import express from "express";
import { specifiedRules } from "graphql";
import {
  getGraphQLParameters,
  processRequest,
  renderGraphiQL,
  shouldRenderGraphiQL,
} from "graphql-helix";
import { InMemoryLiveQueryStore } from "@n1ru4l/in-memory-live-query-store";
import { NoLiveMixedWithDeferStreamRule } from "@n1ru4l/graphql-live-query";
import { schema } from "./schema";

const liveQueryStore = new InMemoryLiveQueryStore();
const rootValue = {
  todos: new Map(),
};

rootValue.todos.set("1", {
  id: "1",
  content: "foo",
  isCompleted: false,
});

const app = express();

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
      execute: liveQueryStore.execute,
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

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`GraphQL server is running on port ${port}.`);
});
