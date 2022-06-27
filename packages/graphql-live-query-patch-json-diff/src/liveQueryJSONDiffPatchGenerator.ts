import { createLiveQueryPatchGenerator } from "@n1ru4l/graphql-live-query-patch";
import { generateJSONDiffPatch } from "./generateJSONDiffPatch.js";

export const liveQueryJSONDiffPatchGenerator = createLiveQueryPatchGenerator(
  generateJSONDiffPatch
);
