import { InMemoryLiveQueryStore } from "@n1ru4l/in-memory-live-query-store";
import { GraphQLLiveDirective } from "@n1ru4l/graphql-live-query";
import { astFromDirective } from "@graphql-tools/utils";
import { createServer, Plugin } from "@graphql-yoga/node";
import Redis from "ioredis";
import { execute as defaultExecute } from "graphql";

const httpPort = parseInt(process.env.PORT ?? "3000", 10);
const redisUri = process.env.REDIS_URI ?? "redis://localhost:6379";

const inMemoryLiveQueryStore = new InMemoryLiveQueryStore();

const client = new Redis(redisUri);
const subClient = new Redis(redisUri);

class RedisLiveQueryStore {
  pub: Redis;
  sub: Redis;
  channel: string;
  liveQueryStore: InMemoryLiveQueryStore;

  constructor(
    pub: Redis,
    sub: Redis,
    channel: string,
    liveQueryStore: InMemoryLiveQueryStore
  ) {
    this.pub = pub;
    this.sub = sub;
    this.liveQueryStore = liveQueryStore;
    this.channel = channel;

    this.sub.subscribe(this.channel, (err) => {
      if (err) throw err;
    });

    this.sub.on("message", (channel, resourceIdentifier) => {
      if (channel === this.channel && resourceIdentifier)
        this.liveQueryStore.invalidate(resourceIdentifier);
    });
  }

  async invalidate(identifiers: Array<string> | string) {
    if (typeof identifiers === "string") {
      identifiers = [identifiers];
    }
    for (const identifier of identifiers) {
      this.pub.publish(this.channel, identifier);
    }
  }

  makeExecute(execute: typeof defaultExecute) {
    return this.liveQueryStore.makeExecute(execute);
  }
}

const liveQueryStore = new RedisLiveQueryStore(
  client,
  subClient,
  "live-query-invalidations",
  inMemoryLiveQueryStore
);

const liveQueryPlugin: Plugin = {
  onExecute(params) {
    params.setExecuteFn(liveQueryStore.makeExecute(params.executeFn));
  },
};

const server = createServer({
  context: () => ({
    liveQueryStore,
    redisClient: client,
  }),
  plugins: [liveQueryPlugin],
  port: httpPort,
  schema: {
    typeDefs: [
      /* GraphQL */ `
        type Query {
          counter: Int!
        }
        type Mutation {
          increment: Boolean
        }
      `,
      astFromDirective(GraphQLLiveDirective),
    ],
    resolvers: {
      Query: {
        async counter(_, __, context) {
          const value = await context.redisClient.get("counter");
          return value == null ? 0 : parseInt(value, 10);
        },
      },
      Mutation: {
        async increment(_, __, context) {
          await context.redisClient.incr("counter");
          await context.liveQueryStore.invalidate(["Query.counter"]);
        },
      },
    },
  },
});

server.start();
