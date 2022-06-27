import type { DefinitionNode, OperationDefinitionNode } from "graphql";
import { getLiveDirectiveNode } from "./getLiveDirectiveNode.js";
import { getLiveDirectiveArgumentValues } from "./getLiveDirectiveArgumentValues.js";

import { isNone, Maybe } from "./Maybe.js";

export const isLiveQueryOperationDefinitionNode = (
  input: DefinitionNode,
  variables?: Maybe<{ [key: string]: unknown }>
): input is OperationDefinitionNode => {
  const liveDirectiveNode = getLiveDirectiveNode(input);
  if (isNone(liveDirectiveNode)) {
    return false;
  }
  return getLiveDirectiveArgumentValues(liveDirectiveNode, variables).isLive;
};
