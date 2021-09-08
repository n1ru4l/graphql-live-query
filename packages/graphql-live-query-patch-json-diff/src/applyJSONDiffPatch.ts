import { ApplyPatchFunction } from "@n1ru4l/graphql-live-query-patch";
import * as jsondiffpatch from "jsondiffpatch";

export const applyJSONDiffPatch: ApplyPatchFunction<jsondiffpatch.Delta> = (
  previous,
  patch
): Record<string, unknown> => {
  const patcher = jsondiffpatch.create();
  // @ts-ignore
  const result = patcher.patch(previous, patch);
  return result;
};
