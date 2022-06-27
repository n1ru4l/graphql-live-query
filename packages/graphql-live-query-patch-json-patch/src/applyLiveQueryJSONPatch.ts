import { createApplyLiveQueryPatch } from "@n1ru4l/graphql-live-query-patch";
import { applyJSONPatch } from "./applyJSONPatch.js";

export const applyLiveQueryJSONPatch =
  createApplyLiveQueryPatch(applyJSONPatch);
