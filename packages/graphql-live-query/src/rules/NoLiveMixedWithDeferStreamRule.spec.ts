import { NoLiveMixedWithDeferStreamRule } from "./NoLiveMixedWithDeferStreamRule.js";
import { GraphQLLiveDirective } from "../GraphQLLiveDirective.js";
import {
  validate,
  parse,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  specifiedRules,
  GraphQLID,
  GraphQLList,
  specifiedDirectives,
} from "@graphql-tools/graphql";

const createSchema = () => {
  const GraphQLUserType = new GraphQLObjectType({
    name: "User",
    fields: {
      id: {
        type: GraphQLID,
      },
      name: {
        type: GraphQLString,
      },
    },
  });

  const query = new GraphQLObjectType({
    name: "query",
    fields: {
      user: {
        type: GraphQLUserType,
        resolve: () => null,
      },
      users: {
        type: new GraphQLList(GraphQLUserType),
        resolve: () => null,
      },
    },
  });

  return new GraphQLSchema({
    query,
    directives: [...specifiedDirectives, GraphQLLiveDirective],
  });
};

test("validation passes without any of @live, @defer and @stream", () => {
  const schema = createSchema();
  const document = parse(/* GraphQL */ `
    query foo {
      user {
        id
      }
    }
  `);
  const errors = validate(schema, document, [
    ...specifiedRules,
    NoLiveMixedWithDeferStreamRule,
  ]);
  expect(errors).toHaveLength(0);
});

test("validation passes with usage of @live", () => {
  const schema = createSchema();
  const document = parse(/* GraphQL */ `
    query foo @live {
      user {
        id
      }
    }
  `);
  const errors = validate(schema, document, [
    ...specifiedRules,
    NoLiveMixedWithDeferStreamRule,
  ]);
  expect(errors).toHaveLength(0);
});

test("validation passes with usage of @stream", () => {
  const schema = createSchema();
  const document = parse(/* GraphQL */ `
    query foo {
      users @stream(initialCount: 1) {
        id
      }
    }
  `);
  const errors = validate(schema, document, [
    ...specifiedRules,
    NoLiveMixedWithDeferStreamRule,
  ]);
  expect(errors).toHaveLength(0);
});

test("validation passes with usage of @defer", () => {
  const schema = createSchema();
  const document = parse(/* GraphQL */ `
    query foo {
      user {
        ... on User @defer {
          id
          name
        }
      }
    }
  `);
  const errors = validate(schema, document, [
    ...specifiedRules,
    NoLiveMixedWithDeferStreamRule,
  ]);
  expect(errors).toHaveLength(0);
});

test.only("validation fails with @live and @defer on the same operation", () => {
  const schema = createSchema();
  const document = parse(/* GraphQL */ `
    query foo @live {
      user {
        ... on User @defer {
          id
          name
        }
      }
    }
  `);
  const errors = validate(schema, document, [
    ...specifiedRules,
    NoLiveMixedWithDeferStreamRule,
  ]);
  expect(errors).toHaveLength(1);
  const [error] = errors;
  expect(error).toMatchInlineSnapshot(
    `[GraphQLError: Cannot mix "@defer" with "@live".]`
  );
});

test("validation fails with @live and @stream on the same operation", () => {
  const schema = createSchema();
  const document = parse(/* GraphQL */ `
    query foo @live {
      users @stream(initialCount: 1) {
        id
        name
      }
    }
  `);
  const errors = validate(schema, document, [
    ...specifiedRules,
    NoLiveMixedWithDeferStreamRule,
  ]);
  expect(errors).toHaveLength(1);
  const [error] = errors;
  expect(error).toMatchInlineSnapshot(
    `[GraphQLError: Cannot mix "@stream" with "@live".]`
  );
});

test("validation passes with @live and @defer on different operations in the same document", () => {
  const schema = createSchema();
  const document = parse(/* GraphQL */ `
    query foo @live {
      users {
        id
        name
      }
    }
    query bar {
      users @stream(initialCount: 1) {
        id
        name
      }
    }
  `);
  const errors = validate(schema, document, [
    ...specifiedRules,
    NoLiveMixedWithDeferStreamRule,
  ]);
  expect(errors).toHaveLength(0);
});
