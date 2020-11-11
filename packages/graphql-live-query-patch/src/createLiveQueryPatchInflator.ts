import { applyPatch } from "fast-json-patch";
import { ExecutionResult } from "graphql";
import { ExecutionLivePatchResult } from "./ExecutionLivePatchResult";

export async function* createLiveQueryPatchInflator(
  asyncIterator: AsyncIterableIterator<
    ExecutionLivePatchResult | ExecutionResult
  >
) {
  let previousValue: ExecutionResult | null = null;
  let previousRevision = 0;

  for await (const result of asyncIterator) {
    if ("revision" in result && result.revision) {
      if (result.data) {
        previousValue = { data: result.data } as ExecutionResult;
        if (result.extensions) {
          previousValue.extensions = result.extensions;
        }
        if (result.errors) {
          previousValue.errors = result.errors;
        }
        previousRevision = result.revision;

        yield previousValue as ExecutionResult;
      } else if (result.patch) {
        if (!previousValue) {
          throw new Error("No previousValue available.");
        }
        if (previousRevision + 1 !== result.revision) {
          throw new Error("Wrong revision received.");
        }

        applyPatch(previousValue.data, result.patch);

        if (result.errors) {
          previousValue.errors = result.errors;
        } else if (previousValue.errors) {
          previousValue.errors = undefined;
        }

        if (result.extensions) {
          previousValue.extensions = result.extensions;
        } else if (previousValue.extensions) {
          previousValue.extensions = undefined;
        }

        yield previousValue as ExecutionResult;
      }
    } else {
      previousValue = null;
      previousRevision = 0;
      yield result;
    }
  }
}
