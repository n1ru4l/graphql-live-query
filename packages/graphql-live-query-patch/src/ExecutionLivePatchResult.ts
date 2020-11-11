import { Operation } from "fast-json-patch";
import { ExecutionResult } from "graphql";

export type ExecutionLivePatchResult = {
  errors?: ExecutionResult["errors"];
  /* data must be included in the first result */
  data?: ExecutionResult["data"];
  /* patch must be present in the next results */
  patch?: Operation[];
  revision?: number;
  extensions?: ExecutionResult["extensions"];
};
