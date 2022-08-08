import { ExecutionResult } from "@graphql-tools/graphql";

export type ExecutionLivePatchResult<PatchPayload = unknown> = {
  errors?: ExecutionResult["errors"];
  /* data must be included in the first result */
  data?: ExecutionResult["data"];
  /* patch must be present in the next results */
  patch?: PatchPayload;
  revision?: number;
  extensions?: ExecutionResult["extensions"];
};
