import type { LiveExecutionResult } from "@n1ru4l/graphql-live-query";
import { compare } from "fast-json-patch";
import type { AsyncExecutionResult, ExecutionResult } from "graphql";
import type { ExecutionLivePatchResult } from "./ExecutionLivePatchResult";

export async function* createLiveQueryPatchDeflator(
  asyncIterator: AsyncIterableIterator<LiveExecutionResult>
): AsyncIterableIterator<
  ExecutionLivePatchResult | ExecutionResult | AsyncExecutionResult
> {
  let previousValue: LiveExecutionResult["data"] | null = null;
  let revision = 0;

  for await (const value of asyncIterator) {
    // if it is not live we simply forward everything :)
    if (!value.isLive) {
      yield value;
      yield* asyncIterator;
      continue;
    }

    revision++;

    const valueToPublish: ExecutionLivePatchResult = { revision };

    if (previousValue) {
      const currentValue = value.data ?? {};
      valueToPublish.patch = compare(previousValue, currentValue);
      previousValue = currentValue;
    } else {
      previousValue = value.data ?? {};
      if ("data" in value) {
        valueToPublish.data = previousValue;
      }
    }

    if ("errors" in value) {
      valueToPublish.errors = value.errors;
    }
    if ("extensions" in value) {
      valueToPublish.extensions = value.extensions;
    }

    yield valueToPublish;
  }
}
