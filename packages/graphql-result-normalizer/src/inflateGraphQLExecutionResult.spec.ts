import { inflateGraphQLExecutionResult } from "./inflateGraphQLExecutionResult";

test("it can inflate a empty response", () => {
  const result = inflateGraphQLExecutionResult({});
  expect(result).toEqual({});
});

test("it can inflate a simple response", () => {
  const result = inflateGraphQLExecutionResult({
    data: {
      ["[ROOT]"]: {
        foo: "LELELE",
        a: 1,
      },
    },
  });
  expect(result).toEqual({
    data: {
      foo: "LELELE",
      a: 1,
    },
  });
});

test("it can inflate a normalized response", () => {
  const result = inflateGraphQLExecutionResult({
    data: {
      ["[ROOT]"]: {
        something: "$$ref:a",
      },
      ["a"]: {
        id: "a",
        foo: "bars",
      },
    },
  });
  expect(result).toEqual({
    data: {
      something: {
        id: "a",
        foo: "bars",
      },
    },
  });
});

test("it can inflate a complex nested response", () => {
  const result = inflateGraphQLExecutionResult({
    data: {
      ["[ROOT]"]: {
        something: "$$ref:a",
      },
      ["a"]: {
        id: "a",
        foo: "bars",
        a: "$$ref:a",
      },
    },
  });
  expect(result).toEqual({
    data: {
      something: {
        id: "a",
        foo: "bars",
        a: {
          id: "a",
        },
      },
    },
  });
});
