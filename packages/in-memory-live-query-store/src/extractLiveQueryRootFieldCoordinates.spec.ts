import { getOperationAST, parse } from "graphql";
import { extractLiveQueryRootFieldCoordinates } from "./extractLiveQueryRootFieldCoordinates";

test("collects the correct identifiers", () => {
  const operation = parse(/* GraphQL */ `
    query node($id: ID!) {
      node(id: $id) {
        id
      }
    }
  `);
  const mainOperation = getOperationAST(operation)!;
  const result = extractLiveQueryRootFieldCoordinates(
    operation,
    mainOperation,
    { id: "1" }
  );
  expect(Array.from(result)).toEqual(["Query.node", `Query.node(id:"1")`]);
});
