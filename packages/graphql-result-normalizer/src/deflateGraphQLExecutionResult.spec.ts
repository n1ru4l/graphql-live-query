import { deflateGraphQLExecutionResult } from "./deflateGraphQLExecutionResult";

test("can be called with empty result", () => {
  const tree = deflateGraphQLExecutionResult({
    errors: undefined,
    data: null,
  });
  expect(tree).toEqual({
    errors: undefined,
    data: {
      ["[ROOT]"]: null,
    },
  });
});

test("can handle string root field", () => {
  const tree = deflateGraphQLExecutionResult({
    errors: undefined,
    data: {
      lel: "string",
    },
  });

  expect(tree).toEqual({
    errors: undefined,
    data: {
      ["[ROOT]"]: {
        lel: "string",
      },
    },
  });
});

test("can handle number root field", () => {
  const tree = deflateGraphQLExecutionResult({
    errors: undefined,
    data: {
      lel: 1,
    },
  });

  expect(tree).toEqual({
    errors: undefined,
    data: {
      ["[ROOT]"]: {
        lel: 1,
      },
    },
  });
});

test("can handle array root field", () => {
  const tree = deflateGraphQLExecutionResult({
    errors: undefined,
    data: {
      lel: [1, 2, 4],
    },
  });

  expect(tree).toEqual({
    errors: undefined,
    data: {
      ["[ROOT]"]: {
        lel: [1, 2, 4],
      },
    },
  });
});

test("can normalize a basic node field", () => {
  const tree = deflateGraphQLExecutionResult({
    errors: undefined,
    data: {
      lel: {
        id: "a",
        prop: 1,
      },
    },
  });

  expect(tree).toEqual({
    errors: undefined,
    data: {
      ["[ROOT]"]: {
        lel: "$$ref:a",
      },
      a: {
        id: "a",
        prop: 1,
      },
    },
  });
});

test("can merge a basic node field", () => {
  const tree = deflateGraphQLExecutionResult({
    errors: undefined,
    data: {
      lel: {
        id: "a",
        prop1: 1,
      },
      bar: {
        id: "a",
        prop2: 2,
      },
    },
  });

  expect(tree).toEqual({
    errors: undefined,
    data: {
      ["[ROOT]"]: {
        lel: "$$ref:a",
        bar: "$$ref:a",
      },
      a: {
        id: "a",
        prop1: 1,
        prop2: 2,
      },
    },
  });
});

test("can merge a nested node field", () => {
  const tree = deflateGraphQLExecutionResult({
    errors: undefined,
    data: {
      lel: {
        id: "a",
        prop1: {
          oi: "a",
          k: {
            id: "b",
            prop5: 3,
          },
        },
      },
      bar: {
        id: "a",
        prop2: 2,
      },
    },
  });

  expect(tree).toEqual({
    errors: undefined,
    data: {
      ["[ROOT]"]: {
        lel: "$$ref:a",
        bar: "$$ref:a",
      },
      a: {
        id: "a",
        prop1: {
          k: "$$ref:b",
          oi: "a",
        },
        prop2: 2,
      },
      b: {
        id: "b",
        prop5: 3,
      },
    },
  });
});
