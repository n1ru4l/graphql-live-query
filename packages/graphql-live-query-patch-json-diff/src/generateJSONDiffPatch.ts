import {
  GeneratePatchFunction,
  noDiffSymbol,
} from "@n1ru4l/graphql-live-query-patch";
import * as jsondiffpatch from "jsondiffpatch";

export const generateJSONDiffPatch: GeneratePatchFunction<
  jsondiffpatch.Delta | undefined
> = (previous, current) => {
  const patcher = jsondiffpatch.create();
  const patch = patcher.diff(previous, current);
  if (patch === undefined) {
    return noDiffSymbol;
  }
  return patch;
};
