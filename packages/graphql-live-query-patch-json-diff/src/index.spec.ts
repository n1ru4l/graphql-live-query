import {
  applyLiveQueryJSONDiffPatch,
  applyLiveQueryJSONDiffPatchGenerator,
} from ".";

function assertAsyncIterable(
  input: object
): asserts input is AsyncIterable<any> {
  if (Symbol.asyncIterator in input) {
    return;
  }
  throw new Error("Noooo");
}

it("can produce correct stuff", async () => {
  async function* execute() {
    yield {
      data: {
        map: {
          id: "1",
          a: "1",
        },
      },
      isLive: true,
    };
    yield {
      data: {
        map: {
          id: "2",
          a: "1",
        },
      },
      isLive: true,
    };
  }

  let source = applyLiveQueryJSONDiffPatchGenerator(execute());
  assertAsyncIterable(source);
  source = applyLiveQueryJSONDiffPatch(source);
  const result = await source.next();
  expect(result.value).toEqual({
    data: {
      map: {
        id: "1",
        a: "1",
      },
    },
  });
  const result1 = await source.next();
  expect(result1.value).toEqual({
    data: {
      map: {
        id: "2",
        a: "1",
      },
    },
  });
});
