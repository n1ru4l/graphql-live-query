import { applyPatch, Operation } from "fast-json-patch";
import { ExecutionResult } from "graphql";
import { ExecutionLivePatchResult } from "./ExecutionLivePatchResult";

export type ApplyPatchFunction = (
  previous: Record<string, unknown>,
  patch: Operation[]
) => Record<string, unknown>;

const defaultApplyPatch: ApplyPatchFunction = (
  previous: Record<string, unknown>,
  patch: Operation[]
): Record<string, unknown> => {
  const result = applyPatch(previous, patch, true, false);
  return result.newDocument;
};

/**
 * Create a middleware generator function for applying live query patches on the client.
 */
export const createApplyLiveQueryPatch = (args?: {
  /* Provide your own custom apply patch function */
  applyPatch?: ApplyPatchFunction;
}) => {
  const applyPatch = args?.applyPatch ?? defaultApplyPatch;

  return async function* applyLiveQueryPatch<
    TExecutionResult = Record<string, unknown>
  >(
    asyncIterator: AsyncIterableIterator<TExecutionResult>
  ): AsyncIterableIterator<TExecutionResult> {
    let mutableData: ExecutionResult | null = null;
    let lastRevision = 0;

    for await (const result of asyncIterator as AsyncIterableIterator<ExecutionLivePatchResult>) {
      // no revision means this is no live query patch.
      if ("revision" in result && result.revision) {
        const valueToPublish: ExecutionLivePatchResult = {};

        if (result.revision === 1) {
          if (!result.data) {
            throw new Error("Missing data.");
          }
          valueToPublish.data = result.data;
          mutableData = result.data;
          lastRevision = 1;
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

          mutableData = applyPatch(
            mutableData as Record<string, unknown>,
            result.patch
          );
          valueToPublish.data = mutableData;

          lastRevision++;
        }

        if (result.extensions) {
          valueToPublish.extensions = result.extensions;
        }
        if (result.errors) {
          valueToPublish.errors = result.errors;
        }

        yield valueToPublish as TExecutionResult;
        continue;
      }

      yield result as TExecutionResult;
      yield* asyncIterator;
    }
  };
};
