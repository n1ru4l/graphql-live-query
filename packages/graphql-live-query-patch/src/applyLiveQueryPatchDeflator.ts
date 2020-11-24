import type { ExecutionResult } from "graphql";
import type { LiveExecutionResult } from "@n1ru4l/graphql-live-query";
import { createLiveQueryPatchDeflator } from "./createLiveQueryPatchDeflator";
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
 *  "afterware" for "execute" for applying deflation.
 */
export const applyLiveQueryPatchDeflator = (
  executionResult: LiveQueryDeflatorExecutionResult
): LiveQueryDeflatorExecutionResult => {
  const handler = (
    result:
      | AsyncIterableIterator<ExecutionResult | LiveExecutionResult>
      | ExecutionResult
  ) => {
    if (isAsyncIterable(result)) {
      return createLiveQueryPatchDeflator(result);
    }
    return result;
  };

  if (executionResult instanceof Promise) {
    return executionResult.then(handler);
  }

  return handler(executionResult);
};
