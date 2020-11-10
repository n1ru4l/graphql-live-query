import { ExecutionResult } from "graphql";
import { LiveExecutionResult } from "packages/graphql-live-query/src";
import { createLiveQueryPatchInflator } from "./createLiveQueryPatchInflator";

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

  const stream = createLiveQueryPatchInflator(source());
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
      initialValue: {
        data: {
          foo: {
            bar: "kek",
          },
        },
      },
      isLiveJSONPatch: true,
      revision: 1,
    } as LiveExecutionResult;
    yield {
      patch: [
        {
          op: "replace",
          path: "/data/foo/bar",
          value: "speck",
        },
      ],
      isLiveJSONPatch: true,
      revision: 2,
    } as LiveExecutionResult;
  }

  const stream = createLiveQueryPatchInflator(source());
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
