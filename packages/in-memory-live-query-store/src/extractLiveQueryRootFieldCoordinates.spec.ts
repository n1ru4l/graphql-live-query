import {
  buildSchema,
  getOperationAST,
  parse,
  TypeInfo,
} from "@graphql-tools/graphql";
import { extractLiveQueryRootFieldCoordinates } from "./extractLiveQueryRootFieldCoordinates.js";

const schema = buildSchema(/* GraphQL */ `
  type Query {
    node(id: ID!): Node!
  }

  type Node {
    id: ID!
  }
`);

const typeInfo = new TypeInfo(schema);

test("collects the correct identifiers", () => {
  const documentNode = parse(/* GraphQL */ `
    query node($id: ID!) {
      node(id: $id) {
        id
      }
    }
  `);
  const operationNode = getOperationAST(documentNode)!;
  const result = extractLiveQueryRootFieldCoordinates({
    documentNode,
    operationNode,
    typeInfo,
    variableValues: { id: "1" },
  });
  expect(Array.from(result)).toEqual(["Query.node", `Query.node(id:"1")`]);
});

test("collects the correct identifiers", () => {
  const documentNode = parse(/* GraphQL */ `
    query node {
      node(id: "1") {
        id
      }
    }
  `);
  const operationNode = getOperationAST(documentNode)!;
  const result = extractLiveQueryRootFieldCoordinates({
    documentNode,
    operationNode,
    typeInfo,
  });
  expect(Array.from(result)).toEqual(["Query.node", `Query.node(id:"1")`]);
});
