import type { DefinitionNode, OperationDefinitionNode } from "graphql";
import { isSome } from "./Maybe";

export const isLiveQueryOperationDefinitionNode = (
  input: DefinitionNode
): input is OperationDefinitionNode =>
  input.kind === "OperationDefinition" &&
  input.operation === "query" &&
  isSome(input.directives?.find((d) => d.name.value === "live"));
