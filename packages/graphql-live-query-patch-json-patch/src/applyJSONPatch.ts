import { ApplyPatchFunction } from "@n1ru4l/graphql-live-query-patch";
import { applyPatch, Operation } from "fast-json-patch";

export const applyJSONPatch: ApplyPatchFunction<Array<Operation>> = (
  previous,
  patch
): Record<string, unknown> => {
  const result = applyPatch(previous, patch, true, false);
  return result.newDocument;
};
