import type { GeneratePatchFunction } from "@n1ru4l/graphql-live-query-patch";
import { noDiffSymbol } from "@n1ru4l/graphql-live-query-patch";
import type { Operation } from "fast-json-patch";
import fastJsonPatch from "fast-json-patch";

export const generateJSONPatch: GeneratePatchFunction<Array<Operation>> = (
  ...args
) => {
  const result = fastJsonPatch.compare(...args);
  if (result.length > 0) {
    return result;
  }
  return noDiffSymbol;
};
