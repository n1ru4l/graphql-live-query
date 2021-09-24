import { patch } from "./patch";

it("applies a primitive delta (replace)", () => {
  expect(
    patch({
      left: 1,
      delta: [1, 2],
    })
  ).toEqual(2);
});

it("applies a primitive delta (replace and no previous value)", () => {
  expect(
    patch({
      left: 1,
      delta: [null, 2],
    })
  ).toEqual(2);
});

it("applies a primitive delta (remove)", () => {
  expect(
    patch({
      left: 1,
      delta: [1, 0, 0],
    })
    // the third array member 0 indicates that the value got removed instead of replaced
  ).toEqual(undefined);
});

it("applies a primitive delta (remove and no previous value)", () => {
  expect(
    patch({
      left: 1,
      delta: [null, 0, 0],
    })
    // the third array member 0 indicates that the value got removed instead of replaced
  ).toEqual(undefined);
});

it("applies a primitive delta (add)", () => {
  expect(
    patch({
      left: undefined,
      delta: [1],
    })
  ).toEqual(1);
});

it("applies a nested delta (remove)", () => {
  expect(
    patch({
      left: { a: 2 },
      delta: { a: [2, 0, 0] },
    })
  ).toEqual({});
});

it("applies a nested delta (remove and no previous value)", () => {
  expect(
    patch({
      left: { a: 2 },
      delta: { a: [null, 0, 0] },
    })
  ).toEqual({});
});

it("applies a nested delta (add)", () => {
  expect(
    patch({
      left: {},
      delta: { a: [2] },
    })
  ).toEqual({ a: 2 });
});

it("applies a deeply nested delta (replace)", () => {
  expect(
    patch({
      left: { a: { a: 1 } },
      delta: { a: { a: [1, 2] } },
    })
  ).toEqual({ a: { a: 2 } });
});

it("applies a deeply nested delta (replace and no previous value)", () => {
  expect(
    patch({
      left: { a: { a: 1 } },
      delta: { a: { a: [null, 2] } },
    })
  ).toEqual({ a: { a: 2 } });
});

it("applies a deeply nested delta (remove)", () => {
  expect(
    patch({
      left: { a: { a: 2 } },
      delta: { a: [{ a: 2 }, 0, 0] },
    })
  ).toEqual({});
});

it("applies a deeply nested delta (remove and no previous value)", () => {
  expect(
    patch({
      left: { a: { a: 2 } },
      delta: { a: [null, 0, 0] },
    })
  ).toEqual({});
});

it("applies a deeply nested delta (add)", () => {
  expect(
    patch({
      left: {},
      delta: { a: [{ a: 2 }] },
    })
  ).toEqual({ a: { a: 2 } });
});

it("applies array delta (remove first member)", () => {
  expect(
    patch({
      left: [1, 2],
      delta: {
        // indicates that this is an array operation
        _t: "a",
        // _ + index of the item
        _0: [
          // the item that is modified
          1,
          // 0, 0 indicates that the item got deleted
          0, 0,
        ],
      },
    })
  ).toEqual([2]);
});

it("applies array delta (remove first member and no previous value)", () => {
  expect(
    patch({
      left: [1, 2],
      delta: {
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
      },
    })
  ).toEqual([2]);
});

it("applies array delta (remove last member)", () => {
  expect(
    patch({
      left: [1, 2],
      delta: {
        // indicates that this is an array operation
        _t: "a",
        // _ + index of the item
        _1: [
          // the item that is modified
          2,
          // 0, 0 indicates that the item got deleted
          0, 0,
        ],
      },
    })
  ).toEqual([1]);
});

it("applies array delta (remove last member and no previous value)", () => {
  expect(
    patch({
      left: [1, 2],
      delta: {
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
      },
    })
  ).toEqual([1]);
});

it("applies array delta (replace array member)", () => {
  expect(
    patch({
      left: [1, 2],
      delta: {
        // indicates that this is an array operation
        _t: "a",
        // _ + index of the item
        "0": [2],
        _0: [
          // the item that is modified
          1,
          // 0, 0 indicates that the item got deleted
          0, 0,
        ],
      },
    })
  ).toEqual([2, 2]);
});

it("applies array delta (replace array member and no previous value)", () => {
  expect(
    patch({
      left: [1, 2],
      delta: {
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
      },
    })
  ).toEqual([2, 2]);
});

it("applies inefficient array delta", () => {
  expect(
    patch({
      left: [{ a: 1 }, { a: 2 }],
      delta: {
        "0": {
          a: [1, 2],
        },
        "1": {
          a: [2, 1],
        },
        _t: "a",
      },
    })
  ).toEqual([{ a: 2 }, { a: 1 }]);
});

it("applies inefficient array delta (no previous value)", () => {
  expect(
    patch({
      left: [{ a: 1 }, { a: 2 }],
      delta: {
        "0": {
          a: [null, 2],
        },
        "1": {
          a: [null, 1],
        },
        _t: "a",
      },
    })
  ).toEqual([{ a: 2 }, { a: 1 }]);
});

it("applies efficient array delta (produced with objectHash function)", () => {
  expect(
    patch({
      left: [{ id: 1 }, { id: 2 }],
      delta: {
        // item index that is moved
        _1: [
          // item that is moved
          {
            id: 2,
          },
          // the new index where the item is moved
          0,
          // indicates that this is an array move operation
          3,
        ],
        _t: "a",
      },
    })
  ).toEqual([{ id: 2 }, { id: 1 }]);
});

it("applies efficient array delta (produced with objectHash function and no previous value)", () => {
  expect(
    patch({
      left: [{ id: 1 }, { id: 2 }],
      delta: {
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
      },
    })
  ).toEqual([{ id: 2 }, { id: 1 }]);
});
