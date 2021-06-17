import { createLiveQueryPatchGenerator } from "@n1ru4l/graphql-live-query-patch";
import { generateJSONDiffPatch } from "./generateJSONDiffPatch";

export const liveQueryJSONDiffPatchGenerator = createLiveQueryPatchGenerator(
  generateJSONDiffPatch
);
