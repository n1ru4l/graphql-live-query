import type { ExecutionResult } from "graphql";

export type LiveExecutionResult = ExecutionResult & { isLive?: true };
