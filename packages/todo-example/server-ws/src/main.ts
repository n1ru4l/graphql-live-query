import { ExecutionArgs, parse, specifiedRules, validate } from "graphql";
import { useServer } from "graphql-ws/lib/use/ws";
import { InMemoryLiveQueryStore } from "@n1ru4l/in-memory-live-query-store";
import { NoLiveMixedWithDeferStreamRule } from "@n1ru4l/graphql-live-query";
import { Server } from "ws";
import { schema } from "./schema";

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
  port: 3415,
  path: "/graphql",
});

useServer(
  {
    schema,
    execute: liveQueryStore.execute,
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

const port = process.env.PORT || 3001;

wsServer.on("listening", () => {
  console.log(`GraphQL server is running on port ${port}.`);
});
