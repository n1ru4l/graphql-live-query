import { applyPatch } from "fast-json-patch";
import { ExecutionResult } from "graphql";
import { JSONPatchLiveExecutionResult } from "./JSONPatchLiveExecutionResult";

export async function* createLiveQueryPatchInflator(
  asyncIterator: AsyncIterableIterator<
    JSONPatchLiveExecutionResult & ExecutionResult
  >
) {
  let previousValue: ExecutionResult | null = null;
  let previousRevision = 0;

  for await (const result of asyncIterator) {
    if (result.isLiveJSONPatch) {
      if (!result.revision) {
        throw new Error("Missing revision for patch result.");
      }
      if (result.initialValue) {
        previousValue = result.initialValue;
        previousRevision = result.revision;

        yield previousValue as ExecutionResult;
      } else if (result.patch) {
        if (previousRevision + 1 !== result.revision) {
          throw new Error("Wrong revision received.");
        }
        applyPatch(previousValue, result.patch);
        yield previousValue as ExecutionResult;
      }
    } else {
      previousValue = null;
      previousRevision = 0;
      yield result;
    }
  }
}
