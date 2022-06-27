import { createLiveQueryPatchGenerator } from "@n1ru4l/graphql-live-query-patch";
import { generateJSONPatch } from "./generateJSONPatch.js";

export const liveQueryJSONPatchGenerator =
  createLiveQueryPatchGenerator(generateJSONPatch);
