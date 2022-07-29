import { createServer as createYoga, Plugin } from "@graphql-yoga/node";
import { InMemoryLiveQueryStore } from "@n1ru4l/in-memory-live-query-store";
import { applyLiveQueryJSONDiffPatchGenerator } from "@n1ru4l/graphql-live-query-patch-jsondiffpatch";
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

const useLiveQueryPlugin = (
  rootValue: unknown
): Plugin<{
  liveQueryStore: InMemoryLiveQueryStore;
}> => ({
  onExecute: (onExecuteContext) => {
    onExecuteContext.setExecuteFn(
      flow(
        onExecuteContext.args.contextValue.liveQueryStore.makeExecute(
          onExecuteContext.executeFn
        ),
        applyLiveQueryJSONDiffPatchGenerator
      )
    );
    onExecuteContext.args.rootValue = rootValue;
  },
});

export async function createServer({ port = 3001 }: { port?: number }) {
  const liveQueryStore = new InMemoryLiveQueryStore();

  const rootValue = {
    todos: new Map(),
  };

  rootValue.todos.set("1", {
    id: "1",
    content: "foo",
    isCompleted: false,
  });

  const yoga = createYoga({
    schema,
    port,
    context: () => ({ liveQueryStore }),
    plugins: [useLiveQueryPlugin(rootValue)],
    maskedErrors: {
      isDev: true,
    },
    logging: false,
  });

  await yoga.start();

  return () => yoga.stop();
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
