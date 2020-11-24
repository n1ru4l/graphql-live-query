import { ExecutionResult } from "graphql";
import { LiveExecutionResult } from "packages/graphql-live-query/src";
import { applyLiveQueryPatchInflator } from "./applyLiveQueryPatchInflator";

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

  const stream = applyLiveQueryPatchInflator(source());
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
      patch: [
        {
          op: "replace",
          path: "/foo/bar",
          value: "speck",
        },
      ],
      revision: 2,
    } as LiveExecutionResult;
  }

  const stream = applyLiveQueryPatchInflator(source());
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
