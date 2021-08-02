import { parse, getOperationAST } from "graphql";
import { getLiveQueryOperationThrottle } from "./getLiveQueryOperationThrottle";

test("operation without @live returns undefined", () => {
  const node = getOperationAST(
    parse(/* GraphQL */ `
      query foo {
        foo
      }
    `)
  )!;

  expect(getLiveQueryOperationThrottle(node)).toBe(undefined);
});

test("operation with @live but no throttle arg returns undefined", () => {
  const node = getOperationAST(
    parse(/* GraphQL */ `
      query foo @live {
        foo
      }
    `)
  )!;

  expect(getLiveQueryOperationThrottle(node)).toBe(undefined);
});

test("operation with @live and 'if' argument set to 'false' returns undefined", () => {
  const node = getOperationAST(
    parse(/* GraphQL */ `
      query foo @live(if: false, throttle: 1000) {
        foo
      }
    `)
  )!;

  expect(getLiveQueryOperationThrottle(node)).toBe(undefined);
});

test("operation with @live and 'throttle' set to an int returns the value", () => {
  const node = getOperationAST(
    parse(/* GraphQL */ `
      query foo @live(throttle: 18395) {
        foo
      }
    `)
  )!;

  expect(getLiveQueryOperationThrottle(node)).toBe(18395);
});

test("operation with @live and 'throttle' expects its value to be an int", () => {
  const node = getOperationAST(
    parse(/* GraphQL */ `
      query foo @live(throttle: "12345") {
        foo
      }
    `)
  )!;

  expect(() => getLiveQueryOperationThrottle(node)).toThrow();
});

test("operation with @live and 'throttle' range checks its value", () => {
  const MAX_INT = 2147483647;
  const MIN_INT = -2147483648;

  let node = getOperationAST(
    parse(/* GraphQL */ `
      query foo @live(throttle: ${MIN_INT - 1}) {
        foo
      }
    `)
  )!;

  expect(() => getLiveQueryOperationThrottle(node)).toThrow();

  node = getOperationAST(
    parse(/* GraphQL */ `
      query foo @live(throttle: ${MAX_INT + 1}) {
        foo
      }
    `)
  )!;

  expect(() => getLiveQueryOperationThrottle(node)).toThrow();
});

test("operation with @live and 'throttle' argument set to a variable returns the value", () => {
  const node = getOperationAST(
    parse(/* GraphQL */ `
      query foo($throttle: Int!) @live(throttle: $throttle) {
        foo
      }
    `)
  )!;

  expect(getLiveQueryOperationThrottle(node, { throttle: 12345 })).toBe(12345);
});

test("operation with @live and 'throttle' argument set to variable rejects non-int values", () => {
  let node = getOperationAST(
    parse(/* GraphQL */ `
      query foo($bool: Boolean = false) @live(throttle: $bool) {
        foo
      }
    `)
  )!;

  expect(() => getLiveQueryOperationThrottle(node, { bool: true })).toThrow();

  node = getOperationAST(
    parse(/* GraphQL */ `
      query foo($str: String!) @live(throttle: $str) {
        foo
      }
    `)
  )!;

  expect(() => getLiveQueryOperationThrottle(node, { str: "invalid" })).toThrow();

  node = getOperationAST(
    parse(/* GraphQL */ `
      query foo($float: Float!) @live(throttle: $float) {
        foo
      }
    `)
  )!;

  expect(() => getLiveQueryOperationThrottle(node, { float: 14.5 })).toThrow();
});
