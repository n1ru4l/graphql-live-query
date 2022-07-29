import {
  GeneratePatchFunction,
  noDiffSymbol,
} from "@n1ru4l/graphql-live-query-patch";
import { diff, Delta, ObjectHashFunction } from "@n1ru4l/json-patch-plus";

/**
 * We use common connection/pagination fields for
 * generating more efficient list patches.
 */
const objectHash: ObjectHashFunction = (object) => {
  if (object["__typename"] != null && object["id"] != null) {
    return `${object["__typename"]}:${object["id"]}`;
  } else if (object["id"] != null) {
    return object["id"];
  } else if (object["node"] != null) {
    return objectHash(object["node"]);
  } else if (object["cursor"] != null) {
    return object["cursor"];
  } else if (object["_id"] != null) {
    return object["_id"];
  }
};

export const generateJSONDiffPatch: GeneratePatchFunction<Delta> = (
  left,
  right
) => {
  const delta = diff(
    { left, right },
    {
      objectHash,
    }
  );
  if (delta === undefined) {
    return noDiffSymbol;
  }
  return delta;
};
