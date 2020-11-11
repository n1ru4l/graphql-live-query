import { applyPatch } from "fast-json-patch";
import { ExecutionResult } from "graphql";
import { ExecutionLivePatchResult } from "./ExecutionLivePatchResult";

export async function* createLiveQueryPatchInflator(
  asyncIterator: AsyncIterableIterator<
    ExecutionLivePatchResult | ExecutionResult
  >
) {
  let mutableData: ExecutionResult | null = null;
  let lastRevision = 0;

  for await (const result of asyncIterator) {
    // no revision means this is no live query patch.
    if ("revision" in result && result.revision) {
      const valueToPublish: ExecutionLivePatchResult = {};

      if (result.revision === 1) {
        if (!result.data) {
          throw new Error("Missing data.");
        }
        valueToPublish.data = result.data;
        mutableData = result.data;
      } else {
        if (!mutableData) {
          throw new Error("No previousData available.");
        }
        if (!result.patch) {
          throw new Error("Missing patch.");
        }
        if (lastRevision + 1 !== result.revision) {
          throw new Error("Wrong revision received.");
        }

        applyPatch(mutableData, result.patch);
        valueToPublish.data = mutableData;
      }

      lastRevision++;

      if (result.extensions) {
        valueToPublish.extensions = result.extensions;
      }
      if (result.errors) {
        valueToPublish.errors = result.errors;
      }

      yield valueToPublish;
      continue;
    }

    yield result;
    yield* asyncIterator;
  }
}
