import type { LiveExecutionResult } from "@n1ru4l/graphql-live-query";
import { compare, Operation } from "fast-json-patch";
import type { AsyncExecutionResult, ExecutionResult } from "graphql";
import type { ExecutionLivePatchResult } from "./ExecutionLivePatchResult";

export type GeneratePatchFunction = (
  previous: Record<string, unknown>,
  current: Record<string, unknown>
) => Operation[];

const defaultGeneratePatch: GeneratePatchFunction = (
  previous: Record<string, unknown>,
  current: Record<string, unknown>
): Operation[] => compare(previous, current);

export type CreateLiveQueryPatchGeneratorArgs = {
  generatePatch?: GeneratePatchFunction;
};

export const createLiveQueryPatchGenerator = (
  args?: CreateLiveQueryPatchGeneratorArgs
) => {
  const generatePatch = args?.generatePatch ?? defaultGeneratePatch;

  return async function* liveQueryPatchGenerator(
    asyncIterator: AsyncIterableIterator<LiveExecutionResult>
  ): AsyncIterableIterator<
    ExecutionLivePatchResult | ExecutionResult | AsyncExecutionResult
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
};
