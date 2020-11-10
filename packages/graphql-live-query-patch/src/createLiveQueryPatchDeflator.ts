import type { LiveExecutionResult } from "@n1ru4l/graphql-live-query";
import { compare } from "fast-json-patch";
import { ExecutionResult } from "graphql";
import { LiveExecutionPatch } from "./LiveExecutionPatch";

export async function* createLiveQueryPatchDeflator(
  asyncIterator: AsyncIterableIterator<LiveExecutionResult>
): AsyncIterableIterator<LiveExecutionPatch & ExecutionResult> {
  let previousValue: LiveExecutionResult["data"] | null = null;
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
        const currentValue = value.data ?? {};

        const patch = compare(previousValue, currentValue);
        previousValue = currentValue;

        const valueToPublish = {
          revision,
          patch,
          isLivePatch: true,
        } as LiveExecutionPatch;

        if ("errors" in value) {
          valueToPublish.errors = value.errors;
        }

        if ("extensions" in value) {
          valueToPublish.extensions = value.extensions;
        }

        yield valueToPublish;
      } else {
        previousValue = value.data ?? {};

        const valueToPublish = {
          revision,
          isLivePatch: true,
        } as LiveExecutionPatch;

        if ("data" in value) {
          valueToPublish.data = previousValue;
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
  }
}
