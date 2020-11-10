import { Operation } from "fast-json-patch";
import { ExecutionResult } from "graphql";

export type JSONPatchLiveExecutionResult = {
  revision?: number;
  initialValue?: ExecutionResult;
  patch?: Operation[];
  isLiveJSONPatch?: true;
  extensions?: { [key: string]: any };
};
