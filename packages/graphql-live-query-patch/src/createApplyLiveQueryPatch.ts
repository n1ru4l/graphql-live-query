import { Repeater } from "@repeaterjs/repeater";
import { ExecutionResult } from "graphql";
import { ExecutionLivePatchResult } from "./ExecutionLivePatchResult.js";

export type ApplyPatchFunction<PatchPayload = unknown> = (
  previous: Record<string, unknown>,
  patch: PatchPayload
) => Record<string, unknown>;

/**
 * Create a middleware generator function for applying live query patches on the client.
 */
export const createApplyLiveQueryPatch =
  <PatchPayload = unknown>(
    /* Function which is used for generating the patches */
    applyPatch: ApplyPatchFunction<PatchPayload>
  ) =>
  <TExecutionResult = Record<string, unknown>>(
    source: AsyncIterable<TExecutionResult>
  ) =>
    new Repeater<TExecutionResult>(async (push, stop) => {
      const iterator = source[Symbol.asyncIterator]();
      stop.then(() => iterator.return?.());
      let mutableData: ExecutionResult | null = null;
      let lastRevision = 0;
      let next: IteratorResult<ExecutionLivePatchResult<PatchPayload>>;

      while ((next = await iterator.next()).done === false) {
        // no revision means this is no live query patch.
        if ("revision" in next.value && next.value.revision) {
          const valueToPublish: ExecutionLivePatchResult = {};

          if (next.value.revision === 1) {
            if (!next.value.data) {
              throw new Error("Missing data.");
            }
            valueToPublish.data = next.value.data;
            mutableData = next.value.data;
            lastRevision = 1;
          } else {
            if (!mutableData) {
              throw new Error("No previousData available.");
            }
            if (!next.value.patch) {
              throw new Error("Missing patch.");
            }
            if (lastRevision + 1 !== next.value.revision) {
              throw new Error("Wrong revision received.");
            }

            mutableData = applyPatch(
              mutableData as Record<string, unknown>,
              next.value.patch
            );
            valueToPublish.data = { ...mutableData } as Record<string, unknown>;

            lastRevision++;
          }

          if (next.value.extensions) {
            valueToPublish.extensions = next.value.extensions;
          }
          if (next.value.errors) {
            valueToPublish.errors = next.value.errors;
          }

          await push(valueToPublish as TExecutionResult);
          continue;
        }

        await push(next.value as TExecutionResult);
      }

      stop();
    });
