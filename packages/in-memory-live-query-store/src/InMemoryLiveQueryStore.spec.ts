import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  parse,
  execute as defaultExecuteImplementation,
  GraphQLList,
  ExecutionArgs,
} from "graphql";
import { isAsyncIterable } from "@graphql-tools/utils";
import { GraphQLLiveDirective } from "@n1ru4l/graphql-live-query";
import { setupFakeTimers, sleep, sleepUntil } from "jest-time-helpers";
import { InMemoryLiveQueryStore } from "./InMemoryLiveQueryStore";

const { setTime } = setupFakeTimers();

function assertAsyncIterable(
  value: unknown
): asserts value is AsyncIterableIterator<any> {
  if (isAsyncIterable(value)) {
    return;
  }
  throw new Error(`result should be an AsyncIterable. Got ${typeof value}.`);
}

function assertNoAsyncIterable(value: unknown) {
  if (isAsyncIterable(value)) {
    throw new Error(
      `result should NOT be an AsyncIterable. Got ${typeof value}.`
    );
  }
}

const getAllValues = async <T>(values: AsyncIterable<T>) => {
  const results: T[] = [];

  for await (const value of values) {
    results.push(value);
  }

  return results;
};

const createTestSchema = (
  mutableSource: {
    query?: string;
    mutation?: string;
    post?: {
      id: string;
      title: string;
    };
    posts?: Array<{
      id: string;
      title: string;
    }>;
  } = {
    query: "queried",
    mutation: "mutated",
    post: {
      id: "1",
      title: "lel",
    },
    posts: [],
  }
) => {
  const GraphQLPostType = new GraphQLObjectType({
    name: "Post",
    fields: {
      id: {
        type: new GraphQLNonNull(GraphQLID),
      },
      title: {
        type: GraphQLString,
      },
    },
  });
  const Query = new GraphQLObjectType({
    name: "Query",
    fields: {
      foo: {
        type: GraphQLString,
        resolve: () => mutableSource.query,
      },
      post: {
        type: GraphQLPostType,
        args: {
          id: {
            type: GraphQLID,
          },
        },
        resolve: () => mutableSource.post,
      },
      posts: {
        type: new GraphQLList(GraphQLPostType),
        args: {
          needle: {
            type: GraphQLString,
          },
          whereAuthorId: {
            type: GraphQLID,
          },
        },
        resolve: () => mutableSource.posts,
      },
    },
  });
  const Mutation = new GraphQLObjectType({
    name: "Mutation",
    fields: {
      foo: {
        type: GraphQLString,
        resolve: () => mutableSource.mutation,
      },
    },
  });

  return new GraphQLSchema({
    query: Query,
    mutation: Mutation,
    directives: [GraphQLLiveDirective],
  });
};

function execute(
  store: InMemoryLiveQueryStore,
  params: ExecutionArgs,
  executeImplementation = defaultExecuteImplementation
) {
  return store.makeExecute(executeImplementation)(params);
}

describe("conformance with default `graphql-js` exports", () => {
  // The tests ins here a snapshot tests to ensure consistent behavior with the default GraphQL functions
  // that are used inside InMemoryLiveQueryStore.execute

  test("returns a sync query result in case no query operation with @live is provided", () => {
    const store = new InMemoryLiveQueryStore();
    const schema = createTestSchema();
    const document = parse(/* GraphQL */ `
      query {
        foo
      }
    `);
    const result = execute(store, {
      document,
      schema,
    });

    expect(result).toEqual({
      data: {
        foo: "queried",
      },
    });
  });

  test("returns a sync mutation result", () => {
    const store = new InMemoryLiveQueryStore();
    const schema = createTestSchema();
    const document = parse(/* GraphQL */ `
      mutation {
        foo
      }
    `);

    const result = execute(store, {
      document,
      schema,
    });

    expect(result).toEqual({
      data: {
        foo: "mutated",
      },
    });
  });

  test("returns an error in case a document without an operation is provided", () => {
    const store = new InMemoryLiveQueryStore();
    const schema = createTestSchema();
    const document = parse(/* GraphQL */ `
      fragment FooFragment on Query {
        foo
      }
    `);

    const result = execute(store, {
      document,
      schema,
    });

    // stay conform with original execute behavior
    expect(result).toMatchInlineSnapshot(`
      Object {
        "errors": Array [
          [GraphQLError: Must provide an operation.],
        ],
      }
    `);
  });

  test("returns an error in case multiple operations but no matching operationName is provided.", () => {
    const store = new InMemoryLiveQueryStore();
    const schema = createTestSchema();
    const document = parse(/* GraphQL */ `
      query a {
        foo
      }
      query b {
        foo
      }
    `);

    const result = execute(store, {
      document,
      schema,
    });

    // stay conform with original execute behavior
    expect(result).toMatchInlineSnapshot(`
      Object {
        "errors": Array [
          [GraphQLError: Must provide operation name if query contains multiple operations.],
        ],
      }
    `);
  });
});

it("returns a AsyncIterable that publishes a query result.", async () => {
  const schema = createTestSchema();
  const store = new InMemoryLiveQueryStore();
  const document = parse(/* GraphQL */ `
    query @live {
      foo
    }
  `);

  const executionResult = execute(store, {
    schema,
    document,
  });

  assertAsyncIterable(executionResult);
  const result = await executionResult.next();
  expect(result).toEqual({
    done: false,
    value: {
      data: {
        foo: "queried",
      },
      isLive: true,
    },
  });
  executionResult.return?.();
});

it("returns a AsyncIterable that publishes a query result after the schema coordinate was invalidated.", async () => {
  const mutableSource = { query: "queried", mutation: "mutated" };
  const schema = createTestSchema(mutableSource);
  const store = new InMemoryLiveQueryStore();
  const document = parse(/* GraphQL */ `
    query @live {
      foo
    }
  `);

  const executionResult = execute(store, {
    schema,
    document,
  });

  assertAsyncIterable(executionResult);

  let result = await executionResult.next();
  expect(result).toEqual({
    done: false,
    value: {
      data: {
        foo: "queried",
      },
      isLive: true,
    },
  });

  mutableSource.query = "changed";
  store.invalidate("Query.foo");

  result = await executionResult.next();
  expect(result).toEqual({
    done: false,
    value: {
      data: {
        foo: "changed",
      },
      isLive: true,
    },
  });

  executionResult.return?.();
});

it("returns a AsyncIterable that publishes a query result after the resource identifier was invalidated.", async () => {
  const schema = createTestSchema();
  const store = new InMemoryLiveQueryStore();
  const document = parse(/* GraphQL */ `
    query @live {
      post {
        id
        title
      }
    }
  `);

  const executionResult = execute(store, {
    schema,
    document,
  });

  assertAsyncIterable(executionResult);

  let result = await executionResult.next();
  expect(result).toEqual({
    done: false,
    value: {
      data: {
        post: {
          id: "1",
          title: "lel",
        },
      },
      isLive: true,
    },
  });

  store.invalidate("Post:1");

  result = await executionResult.next();
  expect(result).toEqual({
    done: false,
    value: {
      data: {
        post: {
          id: "1",
          title: "lel",
        },
      },
      isLive: true,
    },
  });

  executionResult.return?.();
});

it("does not publish when a old resource identifier is invalidated", async () => {
  const mutableSource = {
    post: {
      id: "1",
      title: "lel",
    },
  };
  const schema = createTestSchema(mutableSource);
  const store = new InMemoryLiveQueryStore();
  const document = parse(/* GraphQL */ `
    query @live {
      post {
        id
        title
      }
    }
  `);

  const executionResult = execute(store, {
    schema,
    document,
  });

  assertAsyncIterable(executionResult);

  let result = await executionResult.next();
  expect(result).toEqual({
    done: false,
    value: {
      data: {
        post: {
          id: "1",
          title: "lel",
        },
      },
      isLive: true,
    },
  });

  mutableSource.post.id = "2";
  store.invalidate("Post:1");

  result = await executionResult.next();
  expect(result).toEqual({
    done: false,
    value: {
      data: {
        post: {
          id: "2",
          title: "lel",
        },
      },
      isLive: true,
    },
  });

  store.invalidate("Post:1");
  const nextResult = executionResult.next();

  executionResult.return?.();
  result = await nextResult;
  expect(result).toMatchInlineSnapshot(`
    Object {
      "done": true,
      "value": undefined,
    }
  `);
});

it("can be executed with polymorphic parameter type", () => {
  const mutableSource = { query: "queried", mutation: "mutated" };
  const schema = createTestSchema(mutableSource);
  const store = new InMemoryLiveQueryStore();
  const document = parse(/* GraphQL */ `
    query {
      foo
    }
  `);

  const executionResult = execute(store, { schema, document });
  expect(executionResult).toEqual({
    data: {
      foo: "queried",
    },
  });
});

it("can handle missing NoLiveMixedWithDeferStreamRule", (done) => {
  (async () => {
    const schema = createTestSchema();
    async function* fakeExecute() {
      yield { data: null };
    }

    const store = new InMemoryLiveQueryStore();
    const document = parse(/* GraphQL */ `
      query @live {
        ... on Query @defer(label: "kek") {
          foo
        }
      }
    `);

    const executionResult = await execute(
      store,
      { schema, document },
      fakeExecute as any
    );

    if (isAsyncIterable(executionResult)) {
      const asyncIterator = executionResult[Symbol.asyncIterator]();
      try {
        const res = await asyncIterator.next();
        done("Should throw");
        return;
      } catch (err) {
        expect(err).toMatchInlineSnapshot(
          `[Error: "execute" returned a AsyncIterator instead of a MaybePromise<ExecutionResult>. The "NoLiveMixedWithDeferStreamRule" rule might have been skipped.]`
        );
      }

      done();
      return;
    }
    done("Should return AsyncIterable");
  })();
});

it("can collect additional resource identifiers with 'extensions.liveQuery.collectResourceIdentifiers'", async () => {
  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: "Query",
      fields: {
        ping: {
          type: GraphQLString,
          args: {
            id: {
              type: new GraphQLNonNull(GraphQLString),
            },
          },
          extensions: {
            liveQuery: {
              collectResourceIdentifiers: (_: unknown, args: { id: string }) =>
                args.id,
            },
          },
        },
      },
    }),
  });
  const document = parse(/* GraphQL */ `
    query @live {
      ping(id: "1")
    }
  `);
  const store = new InMemoryLiveQueryStore();
  const executionResult = await execute(store, { schema, document });

  assertAsyncIterable(executionResult);

  const asyncIterator = executionResult[Symbol.asyncIterator]();

  const values = getAllValues(executionResult);

  store.invalidate("1");

  await sleep(0);
  asyncIterator.return?.();

  expect(await values).toHaveLength(2);
});

it("adds the resource identifiers as a extension field.", async () => {
  const schema = createTestSchema();
  const store = new InMemoryLiveQueryStore({
    includeIdentifierExtension: true,
  });
  const document = parse(/* GraphQL */ `
    query ($id: ID!) @live {
      post(id: $id) {
        id
        title
      }
    }
  `);

  const executionResult = execute(store, {
    schema,
    document,
    variableValues: {
      id: "1",
    },
  });

  assertAsyncIterable(executionResult);

  let result = await executionResult.next();
  expect(result).toMatchInlineSnapshot(`
    Object {
      "done": false,
      "value": Object {
        "data": Object {
          "post": Object {
            "id": "1",
            "title": "lel",
          },
        },
        "extensions": Object {
          "liveResourceIdentifier": Array [
            "Query.post",
            "Query.post(id:\\"1\\")",
            "Post:1",
          ],
        },
        "isLive": true,
      },
    }
  `);

  await executionResult.return?.();
});

it("can set the id field name arbitrarily", async () => {
  const arbitraryIdName = "whateverIWant";

  const GraphQLPostType = new GraphQLObjectType({
    name: "Post",
    fields: {
      [arbitraryIdName]: {
        type: new GraphQLNonNull(GraphQLID),
      },
      title: {
        type: GraphQLString,
      },
    },
  });

  const Query = new GraphQLObjectType({
    name: "Query",
    fields: {
      post: {
        type: GraphQLPostType,
        args: {
          id: {
            type: GraphQLID,
          },
        },
        resolve: () => ({
          [arbitraryIdName]: "1",
          title: "lel",
        }),
      },
    },
  });

  const schema = new GraphQLSchema({ query: Query });

  const store = new InMemoryLiveQueryStore({
    includeIdentifierExtension: true,
    idFieldName: arbitraryIdName,
  });

  const document = parse(/* GraphQL */ `
    query($id: ID!) @live {
      post(id: $id) {
        ${arbitraryIdName}
        title
      }
    }
  `);

  const executionResult = execute(store, {
    schema,
    document,
    variableValues: {
      id: "1",
    },
  });

  assertAsyncIterable(executionResult);

  let result = await executionResult.next();

  expect(result.value.extensions.liveResourceIdentifier).toEqual([
    "Query.post",
    'Query.post(id:"1")',
    "Post:1",
  ]);
});

it("can throttle and prevent multiple publishes", async () => {
  const schema = createTestSchema();

  const document = parse(/* GraphQL */ `
    query foo @live(throttle: 100) {
      foo
    }
  `);

  const store = new InMemoryLiveQueryStore();

  const executionResult = execute(store, {
    schema,
    document,
  });

  assertAsyncIterable(executionResult);

  const values: Array<unknown> = [];
  const done = (async function run() {
    for await (const value of executionResult) {
      values.push(value);
    }
  })();

  // trigger multiple invalidations
  store.invalidate("Query.foo");
  store.invalidate("Query.foo");
  store.invalidate("Query.foo");

  executionResult.return!();
  await done;
  // only one value should have be published
  expect(values).toHaveLength(1);
});

it("can throttle and publish new values after the throttle interval", async () => {
  setTime(1000);
  const schema = createTestSchema();

  const document = parse(/* GraphQL */ `
    query foo @live(throttle: 100) {
      foo
    }
  `);

  const store = new InMemoryLiveQueryStore();

  const executionResult = execute(store, {
    schema,
    document,
  });

  assertAsyncIterable(executionResult);

  const values: Array<unknown> = [];
  const done = (async function run() {
    for await (const value of executionResult) {
      values.push(value);
    }
  })();
  store.invalidate("Query.foo");

  await sleep(0);
  expect(values).toHaveLength(1);

  setTime(1100);
  await sleep(0);

  expect(values).toHaveLength(2);
  executionResult.return!();
  await done;
});

it("can prevent execution by returning a string from validateThrottle", async () => {
  const schema = createTestSchema();

  const document = parse(/* GraphQL */ `
    query foo($throttle: Int) @live(throttle: $throttle) {
      foo
    }
  `);

  const store = new InMemoryLiveQueryStore({
    validateThrottleValue: (value) => {
      return value === 100 ? "Noop" : null;
    },
  });

  let executionResult = execute(store, {
    schema,
    document,
    variableValues: {
      throttle: 99,
    },
  });
  assertAsyncIterable(executionResult);

  executionResult = execute(store, {
    schema,
    document,
    variableValues: {
      throttle: 100,
    },
  });
  assertNoAsyncIterable(executionResult);
  expect(executionResult).toMatchInlineSnapshot(`
    Object {
      "errors": Array [
        [GraphQLError: Noop],
      ],
    }
  `);
});

it("can override the throttle interval by returning a number from validateThrottle", async () => {
  setTime(1000);
  const schema = createTestSchema();

  const document = parse(/* GraphQL */ `
    query foo($throttle: Int) @live(throttle: $throttle) {
      foo
    }
  `);

  const store = new InMemoryLiveQueryStore({
    validateThrottleValue: (value) => {
      expect(value).toEqual(420);
      return 690;
    },
  });

  let executionResult = execute(store, {
    schema,
    document,
    variableValues: {
      throttle: 420,
    },
  });
  assertAsyncIterable(executionResult);

  const values: Array<unknown> = [];
  const done = (async function run() {
    for await (const value of executionResult) {
      values.push(value);
    }
  })();

  store.invalidate("Query.foo");
  await sleep(0);
  expect(values).toHaveLength(1);
  setTime(1420);
  await sleep(0);
  expect(values).toHaveLength(1);
  setTime(1420 + 690);
  await sleep(0);

  expect(values).toHaveLength(2);
  executionResult.return!();
  await done;
});

it("index via custom index field of type string", async () => {
  const schema = createTestSchema();

  const store = new InMemoryLiveQueryStore({
    includeIdentifierExtension: true,
    indexBy: [
      {
        field: "Query.posts",
        args: ["needle"],
      },
    ],
  });

  const document = parse(/* GraphQL */ `
    query @live {
      posts(needle: "brrrrrrt") {
        id
        title
      }
    }
  `);

  const executionResult = execute(store, { document, schema });
  assertAsyncIterable(executionResult);
  let result = await executionResult.next();
  expect(result.value).toEqual({
    data: {
      posts: [],
    },
    extensions: {
      liveResourceIdentifier: ["Query.posts", 'Query.posts(needle:"brrrrrrt")'],
    },
    isLive: true,
  });
});

it("index via custom index field with string value", async () => {
  const schema = createTestSchema();

  const store = new InMemoryLiveQueryStore({
    includeIdentifierExtension: true,
    indexBy: [
      {
        field: "Query.posts",
        args: [["needle", "sup"]],
      },
    ],
  });

  const document = parse(/* GraphQL */ `
    query @live {
      posts(needle: "sup") {
        id
        title
      }
    }
  `);

  const executionResult = execute(store, { document, schema });
  assertAsyncIterable(executionResult);
  let result = await executionResult.next();
  expect(result.value).toEqual({
    data: {
      posts: [],
    },
    extensions: {
      liveResourceIdentifier: ["Query.posts", 'Query.posts(needle:"sup")'],
    },
    isLive: true,
  });
});

it("index via custom compound index", async () => {
  const schema = createTestSchema();

  const store = new InMemoryLiveQueryStore({
    includeIdentifierExtension: true,
    indexBy: [
      {
        field: "Query.posts",
        args: ["whereAuthorId", "needle"],
      },
    ],
  });

  const document = parse(/* GraphQL */ `
    query @live {
      posts(needle: "sup", whereAuthorId: "3") {
        id
        title
      }
    }
  `);

  const executionResult = execute(store, { document, schema });
  assertAsyncIterable(executionResult);
  let result = await executionResult.next();
  expect(result.value).toEqual({
    data: {
      posts: [],
    },
    extensions: {
      liveResourceIdentifier: [
        "Query.posts",
        'Query.posts(whereAuthorId:"3",needle:"sup")',
      ],
    },
    isLive: true,
  });
});
