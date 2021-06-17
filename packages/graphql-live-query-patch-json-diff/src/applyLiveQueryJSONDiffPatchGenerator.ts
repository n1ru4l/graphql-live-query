import { createApplyLiveQueryPatchGenerator } from "@n1ru4l/graphql-live-query-patch";
import { generateJSONDiffPatch } from "./generateJSONDiffPatch";

export const applyLiveQueryJSONDiffPatchGenerator =
  createApplyLiveQueryPatchGenerator(generateJSONDiffPatch);
