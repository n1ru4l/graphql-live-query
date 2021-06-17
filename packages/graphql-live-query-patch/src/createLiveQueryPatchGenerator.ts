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

      revision++;

      const valueToPublish: ExecutionLivePatchResult = { revision };

      if (previousValue) {
        const currentValue = value.data ?? {};
        valueToPublish.patch = generatePatch(previousValue, currentValue);
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

      yield valueToPublish;
    }
  };
