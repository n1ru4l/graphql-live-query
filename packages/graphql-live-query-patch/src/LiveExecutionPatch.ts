import { Operation } from "fast-json-patch";
import { ExecutionResult } from "graphql";

export type LiveExecutionPatch = {
  revision?: number;
  data?: ExecutionResult["data"];
  errors?: ExecutionResult["errors"];
  extensions?: ExecutionResult["extensions"];
  patch?: Operation[];
  isLivePatch?: true;
};
