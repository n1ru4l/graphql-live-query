import type { LiveExecutionResult } from "@n1ru4l/graphql-live-query";
import type { ExecutionResult } from "graphql";
import type { ExecutionPatchResult } from "./ExecutionPatchResult";
import type { ExecutionLivePatchResult } from "./ExecutionLivePatchResult";
import { withHandlersFrom } from "@n1ru4l/push-pull-async-iterable-iterator";

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
  (asyncIterableIterator: AsyncIterableIterator<LiveExecutionResult>) =>
    withHandlersFrom(
      (async function* liveQueryPatchGenerator(): AsyncIterableIterator<
        ExecutionLivePatchResult | ExecutionResult | ExecutionPatchResult
      > {
        let previousValue: LiveExecutionResult["data"] | null = null;
        let revision = 1;

        for await (const value of asyncIterableIterator) {
          // if it is not live we simply forward everything :)
          if (!value.isLive) {
            yield value;
            yield* asyncIterableIterator;
            continue;
          }

          const valueToPublish: ExecutionLivePatchResult = {};

          if (previousValue) {
            const currentValue = value.data ?? {};
            const patch = generatePatch(previousValue, currentValue);
            previousValue = currentValue;

            if (patch === noDiffSymbol) {
              continue;
            }

            valueToPublish.patch = patch;
            revision++;
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

          valueToPublish.revision = revision;

          yield valueToPublish;
        }
      })(),
      asyncIterableIterator
    );
