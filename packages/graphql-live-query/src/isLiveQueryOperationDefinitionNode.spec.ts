import { parse, getOperationAST } from "graphql";
import { isLiveQueryOperationDefinitionNode } from "./isLiveQueryOperationDefinitionNode";

test("operation without @live is not a live query", () => {
  const node = getOperationAST(
    parse(/* GraphQL */ `
      query foo {
        foo
      }
    `)
  )!;

  expect(isLiveQueryOperationDefinitionNode(node)).toBe(false);
});

test("operation with @live is a live query", () => {
  const node = getOperationAST(
    parse(/* GraphQL */ `
      query foo @live {
        foo
      }
    `)
  )!;

  expect(isLiveQueryOperationDefinitionNode(node)).toBe(true);
});

test("operation with @live and 'if' argument set to 'true' is a live query", () => {
  const node = getOperationAST(
    parse(/* GraphQL */ `
      query foo @live(if: true) {
        foo
      }
    `)
  )!;

  expect(isLiveQueryOperationDefinitionNode(node)).toBe(true);
});

test("operation with @live and 'if' set to 'false' is not a live query", () => {
  const node = getOperationAST(
    parse(/* GraphQL */ `
      query foo @live(if: false) {
        foo
      }
    `)
  )!;

  expect(isLiveQueryOperationDefinitionNode(node)).toBe(false);
});

test("operation with @live and 'if' argument set to variable with value 'true' is a live query", () => {
  const node = getOperationAST(
    parse(/* GraphQL */ `
      query foo($lel: Boolean!) @live(if: $lel) {
        foo
      }
    `)
  )!;

  expect(isLiveQueryOperationDefinitionNode(node, { lel: true })).toBe(true);
});

test("operation with @live and 'if' argument set to variable with the value 'false' is not a live query", () => {
  const node = getOperationAST(
    parse(/* GraphQL */ `
      query foo($lel: Boolean!) @live(if: $lel) {
        foo
      }
    `)
  )!;

  expect(isLiveQueryOperationDefinitionNode(node, { lel: false })).toBe(false);
});

test("operation with @live and 'if' argument set to variable the default value 'true' is a live query", () => {
  const node = getOperationAST(
    parse(/* GraphQL */ `
      query foo($lel: Boolean = true) @live(if: $lel) {
        foo
      }
    `)
  )!;

  expect(isLiveQueryOperationDefinitionNode(node, {})).toBe(true);
});

test("operation with @live and 'if' argument set to variable the default value 'false' is not a live query", () => {
  const node = getOperationAST(
    parse(/* GraphQL */ `
      query foo($lel: Boolean = false) @live(if: $lel) {
        foo
      }
    `)
  )!;

  expect(isLiveQueryOperationDefinitionNode(node, {})).toBe(false);
});
