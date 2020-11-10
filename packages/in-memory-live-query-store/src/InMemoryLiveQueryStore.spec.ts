import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  parse,
} from "graphql";
import { InMemoryLiveQueryStore } from "./InMemoryLiveQueryStore";

const isAsyncIterable = (value: unknown): value is AsyncIterable<unknown> => {
  return (
    typeof value === "object" && value !== null && Symbol.asyncIterator in value
  );
};

const createTestSchema = (
  mutableSource = { query: "queried", mutation: "mutated" }
) => {
  const Query = new GraphQLObjectType({
    name: "Query",
    fields: {
      foo: {
        type: GraphQLString,
        resolve: () => mutableSource.query,
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

  return new GraphQLSchema({ query: Query, mutation: Mutation });
};

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
    const result = store.execute({
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

    const result = store.execute({
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

    const result = store.execute({
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

    const result = store.execute({
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

  const executionResult = store.execute({
    schema,
    document,
  });

  if (!isAsyncIterable(executionResult)) {
    return fail(
      `result should be a AsyncIterable. Got ${typeof executionResult}.`
    );
  }
  const result = await executionResult.next();
  expect(result).toEqual({
    done: false,
    value: {
      data: {
        foo: "queried",
      },
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

  const executionResult = store.execute({
    schema,
    document,
  });

  if (!isAsyncIterable(executionResult)) {
    return fail(
      `result should be a AsyncIterable. Got ${typeof executionResult}.`
    );
  }

  let result = await executionResult.next();
  expect(result).toEqual({
    done: false,
    value: {
      data: {
        foo: "queried",
      },
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
    },
  });

  executionResult.return?.();
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

  const executionResult = store.execute(schema, document);
  expect(executionResult).toEqual({
    data: {
      foo: "queried",
    },
  });
});

it("can handle missing NoLiveMixedWithDeferStreamRule", async () => {
  const schema = createTestSchema();
  const store = new InMemoryLiveQueryStore();
  const document = parse(/* GraphQL */ `
    query @live {
      ... on Query @defer(label: "kek") {
        foo
      }
    }
  `);

  const executionResult = await store.execute(schema, document);
  if (isAsyncIterable(executionResult)) {
    const result = await executionResult.next();
    expect(result).toMatchInlineSnapshot(`
      Object {
        "done": false,
        "value": Object {
          "errors": Array [
            [GraphQLError: "execute" returned a AsyncIterator instead of a MaybePromise<ExecutionResult>. The "NoLiveMixedWithDeferStreamRule" rule might have been skipped.],
          ],
        },
      }
    `);

    return;
  }
  fail("Should return AsyncIterable");
});
