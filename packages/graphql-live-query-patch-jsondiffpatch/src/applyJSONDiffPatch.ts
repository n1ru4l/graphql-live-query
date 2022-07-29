import { ApplyPatchFunction } from "@n1ru4l/graphql-live-query-patch";
import { patch, Delta } from "@n1ru4l/json-patch-plus";

export const applyJSONDiffPatch: ApplyPatchFunction<Delta> = (
  left,
  delta
): Record<string, unknown> =>
  patch({
    left,
    delta,
  });
