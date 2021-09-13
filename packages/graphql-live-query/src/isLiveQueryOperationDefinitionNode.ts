import type { DefinitionNode, OperationDefinitionNode } from "graphql";
import { getLiveDirectiveNode } from "./getLiveDirectiveNode";
import { getLiveDirectiveArgumentValues } from "./getLiveDirectiveArgumentValues";

import { isNone, Maybe } from "./Maybe";

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
