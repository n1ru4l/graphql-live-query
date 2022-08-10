import { LiveExecutionResult } from "@n1ru4l/graphql-live-query";
import { Repeater } from "@repeaterjs/repeater";
import type { ExecutionResult } from "@graphql-tools/graphql";
import type { ExecutionPatchResult } from "./ExecutionPatchResult.js";
import type { ExecutionLivePatchResult } from "./ExecutionLivePatchResult.js";

/**
 * Symbol that indicates that there is no diff between the previous and current state and thus no patch must be sent to the client.
 * This value should be returned from GeneratePatchFunction.
 */
export const noDiffSymbol = Symbol("noDiffSymbol");

export type GeneratePatchFunction<PatchPayload = unknown> = (
  previous: Record<string, unknown>,
  current: Record<string, unknown>
) => PatchPayload | typeof noDiffSymbol;

export const createLiveQueryPatchGenerator =
  <PatchPayload = unknown>(
    generatePatch: GeneratePatchFunction<PatchPayload>
  ) =>
  (source: AsyncIterableIterator<LiveExecutionResult>) =>
    new Repeater<
      ExecutionLivePatchResult | ExecutionResult | ExecutionPatchResult
    >(async (push, stop) => {
      const iterator = source[Symbol.asyncIterator]();
      stop.then(() => iterator.return?.());

      let previousValue: LiveExecutionResult["data"] | null = null;
      let revision = 1;

      let next: IteratorResult<LiveExecutionResult, void>;

      while ((next = await iterator.next()).done === false) {
        // if it is not live we simply forward everything :)
        if (!next.value.isLive) {
          await push(next.value);
          continue;
        }

        const valueToPublish: ExecutionLivePatchResult = {};
        if (previousValue) {
          const currentValue = next.value.data ?? {};
          const patch = generatePatch(previousValue, currentValue);
          previousValue = currentValue;

          if (patch === noDiffSymbol) {
            continue;
          }

          valueToPublish.patch = patch;
          revision++;
        } else {
          previousValue = next.value.data ?? {};
          if ("data" in next.value) {
            valueToPublish.data = previousValue;
          }
        }

        if ("errors" in next.value) {
          valueToPublish.errors = next.value.errors;
        }
        if ("extensions" in next.value) {
          valueToPublish.extensions = next.value.extensions;
        }

        valueToPublish.revision = revision;

        await push(valueToPublish);
      }

      stop();
    });
