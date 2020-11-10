import type { LiveExecutionResult } from "@n1ru4l/graphql-live-query";
import { compare } from "fast-json-patch";
import { ExecutionResult } from "graphql";
import { JSONPatchLiveExecutionResult } from "./JSONPatchLiveExecutionResult";

export async function* createLiveQueryPatchDeflator(
  asyncIterator: AsyncIterableIterator<LiveExecutionResult>
): AsyncIterableIterator<JSONPatchLiveExecutionResult & ExecutionResult> {
  let previousValue: LiveExecutionResult | null = null;
  let revision = 0;
  for await (const value of asyncIterator) {
    // no live query? reset state.
    if (!value.isLive) {
      previousValue = null;
      revision = 0;
      yield value;
    } else {
      revision = revision + 1;

      if (previousValue) {
        const currentValue: JSONPatchLiveExecutionResult["initialValue"] = {};
        if ("data" in value) {
          currentValue.data = value.data;
        }
        if ("errors" in value) {
          currentValue.errors = value.errors;
        }

        const patch = compare(previousValue, currentValue);
        previousValue = currentValue;

        const valueToPublish = {
          revision,
          patch,
          isLiveJSONPatch: true,
        } as JSONPatchLiveExecutionResult;

        if ("extensions" in value) {
          valueToPublish.extensions = value.extensions;
        }

        yield valueToPublish;
      } else {
        previousValue = {};
        if ("data" in value) {
          previousValue.data = value.data;
        }
        if ("errors" in value) {
          previousValue.errors = value.errors;
        }
        const valueToPublish = {
          revision,
          initialValue: previousValue,
          isLiveJSONPatch: true,
        } as JSONPatchLiveExecutionResult;
        if ("extensions" in value) {
          valueToPublish.extensions = value.extensions;
        }
        yield valueToPublish;
      }
    }
  }
}
