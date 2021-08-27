import type { LiveExecutionResult } from "@n1ru4l/graphql-live-query";
import type { ExecutionResult } from "graphql";
import type { ExecutionPatchResult } from "./ExecutionPatchResult";
import type { ExecutionLivePatchResult } from "./ExecutionLivePatchResult";

export type GeneratePatchFunction<PatchPayload = unknown> = (
  previous: Record<string, unknown>,
  current: Record<string, unknown>
) => PatchPayload;

export const createLiveQueryPatchGenerator = <PatchPayload = unknown>(
  generatePatch: GeneratePatchFunction<PatchPayload>
) =>
  async function* liveQueryPatchGenerator(
    asyncIterator: AsyncIterableIterator<LiveExecutionResult>
  ): AsyncIterableIterator<
    ExecutionLivePatchResult | ExecutionResult | ExecutionPatchResult
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

      const valueToPublish: ExecutionLivePatchResult = {};

      let shouldPublish = true;

      if (previousValue) {
        const currentValue = value.data ?? {};
        valueToPublish.patch = generatePatch(previousValue, currentValue);

        // skip publishing the patch if it's empty.
        shouldPublish = valueToPublish.patch !== undefined;
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

      if (shouldPublish) {
        revision++;
        valueToPublish.revision = revision;
        yield valueToPublish;
      }
    }
  };
