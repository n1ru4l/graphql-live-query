import { createLiveQueryPatchGenerator } from "@n1ru4l/graphql-live-query-patch";
import { generateJSONPatch } from "./generateJSONPatch";

export const liveQueryJSONPatchGenerator =
  createLiveQueryPatchGenerator(generateJSONPatch);
