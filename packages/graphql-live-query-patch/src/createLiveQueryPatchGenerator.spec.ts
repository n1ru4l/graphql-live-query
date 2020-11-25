import { ExecutionResult } from "graphql";
import { LiveExecutionResult } from "packages/graphql-live-query/src";
import { createLiveQueryPatchGenerator } from "./createLiveQueryPatchGenerator";

it("passes through non live query values", async () => {
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

  const stream = createLiveQueryPatchGenerator()(source());

  let value = await stream.next();
  expect(value).toEqual({
    value: {
      data: {
        foo: {
          bar: "kek",
        },
      },
    },
    done: false,
  });
  value = await stream.next();
  expect(value).toEqual({
    value: {
      data: {
        foo: {
          bar: "speck",
        },
      },
    },
    done: false,
  });
  value = await stream.next();
  expect(value).toEqual({
    value: undefined,
    done: true,
  });
});

it("publishes patches for live query results", async () => {
  async function* source() {
    yield {
      data: {
        foo: {
          bar: "kek",
        },
      },
      isLive: true,
    } as LiveExecutionResult;
    yield {
      data: {
        foo: {
          bar: "speck",
        },
      },
      isLive: true,
    } as LiveExecutionResult;
  }

  const stream = createLiveQueryPatchGenerator()(source());

  let value = await stream.next();
  expect(value).toEqual({
    value: {
      data: {
        foo: {
          bar: "kek",
        },
      },
      revision: 1,
    },
    done: false,
  });
  value = await stream.next();
  expect(value).toEqual({
    value: {
      patch: [
        {
          op: "replace",
          path: "/foo/bar",
          value: "speck",
        },
      ],
      revision: 2,
    },
    done: false,
  });
  value = await stream.next();
  expect(value).toEqual({
    value: undefined,
    done: true,
  });
});
