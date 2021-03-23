import { buildSchema, parse, print } from "graphql";
import { buildNodeInterfaceRefetchQueryDocuments } from "./buildNodeInterfaceRefetchQueryDocuments";

const getSchema = () =>
  buildSchema(/* GraphQL */ `
    interface Node {
      id: ID!
    }

    type Position2D {
      x: Float!
      y: Float!
    }

    type MapGrid implements Node {
      id: ID!
      offset: Position2D!
      columnWidth: Float!
      columnHeight: Float!
    }

    type MapToken implements Node {
      id: ID!
      position: Position2D!
      label: String!
    }

    type Map implements Node {
      id: ID!
      title: String!
      grid: MapGrid
      tokens: [MapToken!]!
    }

    type Query {
      node(id: ID!): Node
      activeMap: Map
    }
  `);

test("it can extract a basic resource", () => {
  const schema = getSchema();

  const operationAST = parse(/* GraphQL */ `
    query {
      activeMap {
        id
        title
      }
    }
  `);

  const result = buildNodeInterfaceRefetchQueryDocuments(schema, operationAST);
  const document = result.get("activeMap")!;

  expect(document).toBeDefined();
  expect(print(document)).toMatchInlineSnapshot(`
    "query liveNode($id: ID!) {
      node(id: $id) {
        ... on Map {
          id
          title
        }
      }
    }
    "
  `);
});

it("can extract multiple flat resources", () => {
  const schema = getSchema();

  const operationAST = parse(/* GraphQL */ `
    query {
      activeMap {
        id
        title
        grid {
          id
          offset {
            x
            y
          }
          columnWidth
          columnHeight
        }
      }
    }
  `);

  const result = buildNodeInterfaceRefetchQueryDocuments(schema, operationAST);

  const mapDocument = result.get("activeMap")!;
  expect(mapDocument).toBeDefined();
  expect(print(mapDocument)).toMatchInlineSnapshot(`
    "query liveNode($id: ID!) {
      node(id: $id) {
        ... on Map {
          id
          title
        }
      }
    }
    "
  `);

  const mapGridDocument = result.get("activeMap.grid")!;
  expect(mapGridDocument).toBeDefined();
  expect(print(mapGridDocument)).toMatchInlineSnapshot(`
      "query liveNode($id: ID!) {
        node(id: $id) {
          ... on MapGrid {
            id
            offset {
              x
              y
            }
            columnWidth
            columnHeight
          }
        }
      }
      "
  `);
});

it("can extract list resources", () => {
  const schema = getSchema();

  const operationAST = parse(/* GraphQL */ `
    query {
      activeMap {
        id
        title
        tokens {
          id
          label
          position {
            x
            y
          }
        }
      }
    }
  `);

  const result = buildNodeInterfaceRefetchQueryDocuments(schema, operationAST);

  const mapDocument = result.get("activeMap")!;
  expect(mapDocument).toBeDefined();
  expect(print(mapDocument)).toMatchInlineSnapshot(`
    "query liveNode($id: ID!) {
      node(id: $id) {
        ... on Map {
          id
          title
        }
      }
    }
    "
  `);

  const mapGridDocument = result.get("activeMap.tokens")!;
  expect(mapGridDocument).toBeDefined();
  expect(print(mapGridDocument)).toMatchInlineSnapshot(`
    "query liveNode($id: ID!) {
      node(id: $id) {
        ... on MapToken {
          id
          label
          position {
            x
            y
          }
        }
      }
    }
    "
  `);
});

it("also handles fragments", () => {
  const schema = getSchema();

  const operationAST = parse(/* GraphQL */ `
    fragment token on MapToken {
      id
      label
      position {
        x
        y
      }
    }
    query main {
      activeMap {
        id
        title
        tokens {
          ...token
        }
      }
    }
  `);
  const result = buildNodeInterfaceRefetchQueryDocuments(
    schema,
    operationAST,
    "main"
  );

  const mapDocument = result.get("activeMap")!;
  expect(mapDocument).toBeDefined();
  expect(print(mapDocument)).toMatchInlineSnapshot(`
     "query liveNode($id: ID!) {
       node(id: $id) {
         ... on Map {
           id
           title
         }
       }
     }
     "
   `);

  const mapGridDocument = result.get("activeMap.tokens")!;
  expect(mapGridDocument).toBeDefined();
  expect(print(mapGridDocument)).toMatchInlineSnapshot(`
    "query liveNode($id: ID!) {
      node(id: $id) {
        ... on MapToken {
          ... on MapToken {
            id
            label
            position {
              x
              y
            }
          }
        }
      }
    }
    "
  `);
});
