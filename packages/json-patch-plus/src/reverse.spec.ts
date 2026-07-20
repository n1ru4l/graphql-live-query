import { reverse } from "./reverse";

it("reverses a primitive delta (replace)", () => {
  expect(reverse([1, 2])).toStrictEqual([2, 1]);
});

it("reverses a primitive delta (replace and no previous value)", () => {
  expect(reverse([null, 2])).toStrictEqual([2, null]);
});

it("reverses a nested delta (replace)", () => {
  expect(reverse({ a: [1, 2] })).toStrictEqual({ a: [2, 1] });
});

it("reverses a nested delta (replace and no previous value)", () => {
  expect(reverse({ a: [null, 2] })).toStrictEqual({ a: [2, null] });
});

it("reverses a nested delta (add)", () => {
  expect(reverse({ a: [2] })).toStrictEqual({ a: [2, 0, 0] });
});

it("reverses a nested delta (key removed)", () => {
  expect(
    reverse({
      b: [2, 0, 0],
    })
  ).toStrictEqual({
    b: [2],
  });
});

it("reverses a deeply nested delta (replace)", () => {
  expect(reverse({ a: { a: [1, 2] } })).toStrictEqual({ a: { a: [2, 1] } });
});

it("reverses a deeply nested delta (replace and no previous value)", () => {
  expect(reverse({ a: { a: [null, 2] } })).toStrictEqual({
    a: { a: [2, null] },
  });
});

it("reverses a deeply nested delta (add)", () => {
  expect(reverse({ a: { a: [2] } })).toStrictEqual({ a: { a: [2, 0, 0] } });
});

it("reverses a deeply nested delta (remove)", () => {
  expect(reverse({ a: { a: [2, 0, 0] } })).toStrictEqual({ a: { a: [2] } });
});

it("reverses a deeply nested delta (replace and no previous value)", () => {
  expect(reverse({ a: { a: [null, 2] } })).toStrictEqual({
    a: { a: [2, null] },
  });
});

it("reverses a text added delta", () => {
  expect(reverse(["some text"])).toStrictEqual(["some text", 0, 0]);
});

it("reverses an array added delta", () => {
  expect(reverse([[1, 2, 3]])).toStrictEqual([[1, 2, 3], 0, 0]);
});

it("reverses an array delta (simple values)", () => {
  expect(
    reverse({
      _t: "a",
      _1: [2, 0, 0],
      _5: [6, 0, 0],
      _6: [7, 0, 0],
      6: [9.1],
    })
  ).toStrictEqual({
    _t: "a",
    1: [2],
    5: [6],
    6: [7],
    _6: [9.1, 0, 0],
  });
});

it("reverses array delta (remove first member)", () => {
  expect(
    reverse({
      // indicates that this is an array operation
      _t: "a",
      // _ + index of the item
      _0: [
        // the item that is modified
        1,
        // 0, 0 indicates that the item got deleted
        0, 0,
      ],
    })
  ).toStrictEqual([2]);
});

it("nested changes among array insertions and deletions", () => {
  expect(
    reverse({
      _t: "a",
      0: [{ id: 3 }],
      2: {
        inner: {
          property: ["abc", "abcd"],
        },
      },
      3: [{ id: 9 }],
      _0: [{ id: 1 }, 0, 0],
      _1: [{ id: 2 }, 0, 0],
      _3: [{ id: 5 }, 0, 0],
      _5: [{ id: 7 }, 0, 0],
      _6: [{ id: 8 }, 0, 0],
      _7: [{ id: 10 }, 0, 0],
      _8: [{ id: 11 }, 0, 0],
      _9: [{ id: 12 }, 0, 0],
    })
  ).toStrictEqual({
    _t: "a",
    0: [{ id: 1 }],
    1: [{ id: 2 }],
    3: [{ id: 5 }],
    4: {
      inner: {
        property: ["abcd", "abc"],
      },
    },
    5: [{ id: 7 }],
    6: [{ id: 8 }],
    7: [{ id: 10 }],
    8: [{ id: 11 }],
    9: [{ id: 12 }],
    _0: [{ id: 3 }, 0, 0],
    _3: [{ id: 9 }, 0, 0],
  });
});

it("reverses text delta (larger than min length)", () => {
  expect(
    reverse(["@@ -1,10 +1,11 @@\n -\n-M\n+P\n adre,%0Acu\n+a\n", 0, 2])
  ).toStrictEqual(["@@ -1,11 +1,10 @@\n -\n-P\n+M\n adre,%0Acu\n-a\n", 0, 2]);
});

it("reverses text delta (shorter than min length)", () => {
  expect(reverse(["-Madre,\nc", "-Padre,\ncua"])).toStrictEqual([
    "-Padre,\ncua",
    "-Madre,\nc",
  ]);
});

it("returns undefined when reversing undefined", () => {
  // @ts-ignore
  expect(reverse(undefined)).toStrictEqual(undefined);
});
