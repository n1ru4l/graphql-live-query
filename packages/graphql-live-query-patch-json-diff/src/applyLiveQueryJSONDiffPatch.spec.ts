import { ExecutionResult } from "graphql";
import { LiveExecutionResult } from "@n1ru4l/graphql-live-query";
import { applyLiveQueryJSONDiffPatch } from "./applyLiveQueryJSONDiffPatch.js";

test("pass through non live query patch result", async () => {
  async function* source() {
    yield {
      data: {
        foo: {
          bar: "kek",
        },
      },
    } as ExecutionResult;
    yield {
      data: {
        foo: {
          bar: "speck",
        },
      },
    } as ExecutionResult;
  }

  const stream = applyLiveQueryJSONDiffPatch(source());
  let value = await stream.next();
  expect(value).toEqual({
    done: false,
    value: {
      data: {
        foo: {
          bar: "kek",
        },
      },
    },
  });
  value = await stream.next();
  expect(value).toEqual({
    done: false,
    value: {
      data: {
        foo: {
          bar: "speck",
        },
      },
    },
  });
  value = await stream.next();
  expect(value).toEqual({
    done: true,
    value: undefined,
  });
});

it("applies patch results", async () => {
  async function* source() {
    yield {
      data: {
        foo: {
          bar: "kek",
        },
      },
      revision: 1,
    } as LiveExecutionResult;
    yield {
      patch: {
        foo: {
          bar: ["kek", "speck"],
        },
      },
      revision: 2,
    } as LiveExecutionResult;
  }

  const stream = applyLiveQueryJSONDiffPatch(source());
  let value = await stream.next();
  expect(value).toEqual({
    done: false,
    value: {
      data: {
        foo: {
          bar: "kek",
        },
      },
    },
  });
  value = await stream.next();
  expect(value).toEqual({
    done: false,
    value: {
      data: {
        foo: {
          bar: "speck",
        },
      },
    },
  });
  value = await stream.next();
  expect(value).toEqual({
    done: true,
    value: undefined,
  });
});

it("source.return is called for cleanup", async () => {
  let isCalled = false;
  let counter = 0;
  const source: AsyncGenerator<Record<string, unknown>> = {
    [Symbol.asyncIterator]() {
      return source;
    },
    return() {
      isCalled = true;
      return Promise.resolve({ done: true, value: false });
    },
    async next() {
      counter++;
      if (counter > 1) {
        return Promise.resolve({ done: true, value: undefined });
      }
      return Promise.resolve({ done: false, value: {} });
    },
    async throw() {
      throw new Error("Noop.");
    },
  };

  const stream = applyLiveQueryJSONDiffPatch(source);

  await stream.next();
  await stream.return();

  expect(isCalled).toEqual(true);
});
