import * as graphql from "graphql";
import * as ia from "iterall";
import {
  LiveQueryStore,
  extractLiveQueries,
} from "@n1ru4l/graphql-live-queries";

export const registerGraphQLLayer = (d: {
  socketServer: SocketIO.Server;
  schema: graphql.GraphQLSchema;
  liveQueryStore: LiveQueryStore;
  createContext: () => unknown;
}) => {
  d.socketServer.on("connection", (socket) => {
    const liveSubscriptions = new Map<string, () => void>();
    const subscriptionSubscriptions = new Map<string, () => void>();

    socket.on("@graphql/execute", (message) => {
      const id = message.id;
      const source = message.operation;
      const variableValues = message.variables;
      const operationName = message.operationName;

      const contextValue = d.createContext();
      const rootValue = {};

      const execOptions = {
        schema: d.schema,
        contextValue,
        rootValue,
        operationName,
        source,
        variableValues,
      };

      const execQuery = () => graphql.graphql(execOptions);

      const liveQueries = extractLiveQueries(graphql.parse(source));

      if (liveQueries.length > 1) {
        throw new Error(
          "Document is allowed to only contain one live query document."
        );
      } else if (liveQueries.length === 1) {
        const [liveQuery] = liveQueries;
        const unsubscribe = d.liveQueryStore.register(
          liveQuery,
          execQuery,
          (result: graphql.ExecutionResult) => {
            socket.emit("@graphql/result", { id, ...result });
          }
        );
        liveSubscriptions.set(id, unsubscribe);
      } else {
        graphql.graphql(execOptions).then((result) => {
          result.errors?.forEach((error) => {
            console.error(error.originalError);
          });
          socket.emit("@graphql/result", { id, ...result });
        });
      }
    });

    socket.on("@graphql/unsubscribe-live", (message) => {
      const id = message.id;
      const subscription = liveSubscriptions.get(id);
      subscription?.();
      liveSubscriptions.delete(id);
    });

    socket.on("@graphql/subscribe", (message) => {
      const id = message.id;
      const document = message.operation;
      const variables = message.variables;
      const operationName = message.operationName;

      graphql
        .subscribe({
          schema: d.schema,
          contextValue: d.createContext(),
          rootValue: {},
          operationName,
          document: graphql.parse(document),
          variableValues: variables,
        })
        .then((result) => {
          if (ia.isAsyncIterable(result)) {
            subscriptionSubscriptions.set(id, () => result.return?.(null));
            const run = async () => {
              for await (const subscriptionResult of result) {
                socket.emit("@graphql/update", { id, ...subscriptionResult });
              }
            };
            run();
          } else {
            socket.emit("@graphql/update", { id, ...result });
          }
        });
    });

    socket.on("@graphql/unsubscribe", (message) => {
      const id = message.id;
      const subscription = liveSubscriptions.get(id);
      subscription?.();
      liveSubscriptions.delete(id);
    });

    socket.once("disconnect", () => {
      // Unsubscribe all pending GraphQL Live Queries and Subscriptions
      liveSubscriptions.forEach((unsubscribe) => unsubscribe());
      subscriptionSubscriptions.forEach((unsubscribe) => unsubscribe());
    });
  });
};
