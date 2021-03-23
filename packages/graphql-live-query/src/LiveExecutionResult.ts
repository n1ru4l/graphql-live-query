import type { ExecutionResult } from "graphql";

export type LiveExecutionResult = ExecutionResult & {
  isLive?: true;
  /**
   * experimental path property for live queries that update at a document at a certain path.
   */
  path?: Array<string | number> | undefined;
};
