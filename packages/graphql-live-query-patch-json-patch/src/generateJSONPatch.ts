import type { GeneratePatchFunction } from "@n1ru4l/graphql-live-query-patch";
import { Operation, compare } from "fast-json-patch";

export const generateJSONPatch: GeneratePatchFunction<
  Array<Operation> | undefined
> = (...args) => {
  const result = compare(...args);
  if (result.length > 0) {
    return result;
  }
};
