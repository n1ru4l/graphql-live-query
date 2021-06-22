import type { GeneratePatchFunction } from "@n1ru4l/graphql-live-query-patch";
import * as jsondiffpatch from "jsondiffpatch";

export const generateJSONDiffPatch: GeneratePatchFunction<
  jsondiffpatch.Delta | undefined
> = (previous, current) => {
  const patcher = jsondiffpatch.create();
  return patcher.diff(previous, current);
};
