import { createApplyLiveQueryPatch } from "@n1ru4l/graphql-live-query-patch";
import { applyJSONDiffPatch } from "./applyJSONDiffPatch.js";

export const applyLiveQueryJSONDiffPatch =
  createApplyLiveQueryPatch(applyJSONDiffPatch);
