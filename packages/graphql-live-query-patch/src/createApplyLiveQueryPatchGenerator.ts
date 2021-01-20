import type { ExecutionResult } from "graphql";
import type { LiveExecutionResult } from "@n1ru4l/graphql-live-query";
import {
  createLiveQueryPatchGenerator,
  CreateLiveQueryPatchGeneratorArgs,
} from "./createLiveQueryPatchGenerator";

type MaybePromise<T> = T | Promise<T>;

const isAsyncIterable = (value: unknown): value is AsyncIterable<unknown> => {
  return (
    typeof value === "object" && value !== null && Symbol.asyncIterator in value
  );
};

type LiveQueryDeflatorExecutionResult = MaybePromise<
  AsyncIterableIterator<ExecutionResult | LiveExecutionResult> | ExecutionResult
>;

/**
 *  afterware for wrapping execute in order to generate live query patches.
 */
export const createApplyLiveQueryPatchGenerator = (
  args?: CreateLiveQueryPatchGeneratorArgs
) => {
  return (
    executionResult: LiveQueryDeflatorExecutionResult
  ): LiveQueryDeflatorExecutionResult => {
    const makePatch = createLiveQueryPatchGenerator(args);

    const handler = (
      result:
        | AsyncIterableIterator<ExecutionResult | LiveExecutionResult>
        | ExecutionResult
    ) => {
      if (isAsyncIterable(result)) {
        return makePatch(result);
      }
      return result;
    };

    if (executionResult instanceof Promise) {
      return executionResult.then(handler);
    }

    return handler(executionResult);
  };
};
