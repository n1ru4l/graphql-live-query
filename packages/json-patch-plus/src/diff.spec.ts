import { diff } from "./diff";

it("produces no patch for unchanged primitive type", () => {
  expect(
    diff({
      left: 1,
      right: 1,
    })
  ).toEqual(undefined);
});

it("produces patch for changed primitive type", () => {
  expect(
    diff({
      left: 1,
      right: 2,
    })
  ).toEqual([null, 2]);
});

it("produces patch for changed primitive type (include previous value)", () => {
  expect(
    diff(
      {
        left: 1,
        right: 2,
      },
      {
        includePreviousValue: true,
      }
    )
  ).toEqual([1, 2]);
});

it("produces patch for removed primitive type", () => {
  expect(
    diff({
      left: 1,
      right: undefined,
    })
    // the third array member 0 indicates that the value got removed instead of replaced
  ).toEqual([null, 0, 0]);
});

it("produces patch for removed primitive type (exclude previous value)", () => {
  expect(
    diff(
      {
        left: 1,
        right: undefined,
      },
      {
        includePreviousValue: true,
      }
    )
    // the third array member 0 indicates that the value got removed instead of replaced
  ).toEqual([1, 0, 0]);
});

it("produces patch for added primitive type", () => {
  expect(
    diff({
      left: undefined,
      right: 1,
    })
  ).toEqual([1]);
});

it("produces no patch for identical nested types", () => {
  expect(
    diff({
      left: { a: 1 },
      right: { a: 1 },
    })
  ).toEqual(undefined);
});

it("produces patch for changed nested types", () => {
  expect(
    diff({
      left: { a: 1 },
      right: { a: 2 },
    })
  ).toEqual({ a: [null, 2] });
});

it("produces patch for changed nested types (include previous value)", () => {
  expect(
    diff(
      {
        left: { a: 1 },
        right: { a: 2 },
      },
      {
        includePreviousValue: true,
      }
    )
  ).toEqual({ a: [1, 2] });
});

it("produces patch for removed nested property", () => {
  expect(
    diff({
      left: { a: 2 },
      right: {},
    })
  ).toEqual({ a: [null, 0, 0] });
});

it("produces patch for removed nested property (include previous value)", () => {
  expect(
    diff(
      {
        left: { a: 2 },
        right: {},
      },
      {
        includePreviousValue: true,
      }
    )
  ).toEqual({ a: [2, 0, 0] });
});

it("produces patch for added nested property", () => {
  expect(
    diff({
      left: {},
      right: { a: 2 },
    })
  ).toEqual({ a: [2] });
});

it("produces patch for changed deeply nested types", () => {
  expect(
    diff({
      left: { a: { a: 1 } },
      right: { a: { a: 2 } },
    })
  ).toEqual({ a: { a: [null, 2] } });
});

it("produces patch for changed deeply nested types (include previous value)", () => {
  expect(
    diff(
      {
        left: { a: { a: 1 } },
        right: { a: { a: 2 } },
      },
      {
        includePreviousValue: true,
      }
    )
  ).toEqual({ a: { a: [1, 2] } });
});

it("produces patch for removed deeply nested property", () => {
  expect(
    diff({
      left: { a: { a: 2 } },
      right: {},
    })
  ).toEqual({ a: [null, 0, 0] });
});

it("produces patch for removed deeply nested property (include previous value)", () => {
  expect(
    diff(
      {
        left: { a: { a: 2 } },
        right: {},
      },
      {
        includePreviousValue: true,
      }
    )
  ).toEqual({ a: [{ a: 2 }, 0, 0] });
});

it("produces patch for added deeply nested property", () => {
  expect(
    diff({
      left: {},
      right: { a: { a: 2 } },
    })
  ).toEqual({ a: [{ a: 2 }] });
});

it("produces no patch for unmoved array items", () => {
  expect(
    diff({
      left: [1, 2],
      right: [1, 2],
    })
  ).toEqual(undefined);
});

it("produces a patch for deleted array items (first member)", () => {
  expect(
    diff({
      left: [1, 2],
      right: [2],
    })
  ).toEqual({
    // indicates that this is an array operation
    _t: "a",
    // _ + index of the item
    _0: [
      // the item that is modified
      null,
      // 0, 0 indicates that the item got deleted
      0,
      0,
    ],
  });
});

it("produces a patch for deleted array items (first member and include previous value)", () => {
  expect(
    diff(
      {
        left: [1, 2],
        right: [2],
      },
      {
        includePreviousValue: true,
      }
    )
  ).toEqual({
    // indicates that this is an array operation
    _t: "a",
    // _ + index of the item
    _0: [
      // the item that is modified
      1,
      // 0, 0 indicates that the item got deleted
      0, 0,
    ],
  });
});

it("produces a patch for deleted array items (last member)", () => {
  expect(
    diff({
      left: [1, 2],
      right: [1],
    })
  ).toEqual({
    // indicates that this is an array operation
    _t: "a",
    // _ + index of the item
    _1: [
      // the item that is modified
      null,
      // 0, 0 indicates that the item got deleted
      0,
      0,
    ],
  });
});

it("produces a patch for deleted array items (last member and exclude previous value)", () => {
  expect(
    diff(
      {
        left: [1, 2],
        right: [1],
      },
      {
        includePreviousValue: true,
      }
    )
  ).toEqual({
    // indicates that this is an array operation
    _t: "a",
    // _ + index of the item
    _1: [
      // the item that is modified
      2,
      // 0, 0 indicates that the item got deleted
      0, 0,
    ],
  });
});

it("produces a patch for replaced array items", () => {
  expect(
    diff({
      left: [1, 2],
      right: [2, 2],
    })
  ).toEqual({
    // indicates that this is an array operation
    _t: "a",
    // _ + index of the item
    "0": [2],
    _0: [
      // the item that is modified
      null,
      // 0, 0 indicates that the item got deleted
      0,
      0,
    ],
  });
});

it("produces an inefficient patch for replaced array items without objectHash", () => {
  expect(
    diff({
      left: [{ a: 1 }, { a: 2 }],
      right: [{ a: 2 }, { a: 1 }],
    })
  ).toEqual({
    "0": {
      a: [null, 2],
    },
    "1": {
      a: [null, 1],
    },
    _t: "a",
  });
});

it("produces an inefficient patch for replaced array items without objectHash (exclude previous value)", () => {
  expect(
    diff(
      {
        left: [{ a: 1 }, { a: 2 }],
        right: [{ a: 2 }, { a: 1 }],
      },
      {
        includePreviousValue: true,
      }
    )
  ).toEqual({
    "0": {
      a: [1, 2],
    },
    "1": {
      a: [2, 1],
    },
    _t: "a",
  });
});

it("produces a more efficient patch for replaced array items with objectHash", () => {
  expect(
    diff(
      {
        left: [{ id: 1 }, { id: 2 }],
        right: [{ id: 2 }, { id: 1 }],
      },
      {
        objectHash: (item) => item["id"],
      }
    )
  ).toEqual({
    // item index that is moved
    _1: [
      // item that is moved
      null,
      // the new index where the item is moved
      0,
      // indicates that this is an array move operation
      3,
    ],
    _t: "a",
  });
});

it("produces a more efficient patch for replaced array items with objectHash (exclude previous value)", () => {
  expect(
    diff(
      {
        left: [{ id: 1 }, { id: 2 }],
        right: [{ id: 2 }, { id: 1 }],
      },
      {
        objectHash: (item) => item["id"],
        includePreviousValue: true,
      }
    )
  ).toEqual({
    // item index that is moved
    _1: [
      // item that is moved
      { id: 2 },
      // the new index where the item is moved
      0,
      // indicates that this is an array move operation
      3,
    ],
    _t: "a",
  });
});

test("replace with null", () => {
  expect(
    diff({
      left: {
        map: { id: "2" },
      },
      right: {
        map: null,
      },
    })
  ).toEqual({
    map: [null, null],
  });
});
