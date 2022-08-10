import type { ExecutionResult } from "@graphql-tools/graphql";

export type LiveExecutionResult = ExecutionResult & { isLive?: true };
