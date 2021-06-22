import { createApplyLiveQueryPatch } from "@n1ru4l/graphql-live-query-patch";
import { applyJSONDiffPatch } from "./applyJSONDiffPatch";

export const applyLiveQueryJSONDiffPatch =
  createApplyLiveQueryPatch(applyJSONDiffPatch);
