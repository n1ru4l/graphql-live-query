import type { DefinitionNode, OperationDefinitionNode } from "graphql";
import { isSome, isNone, Maybe } from "./Maybe";

export const isLiveQueryOperationDefinitionNode = (
  input: DefinitionNode,
  variables?: Maybe<{ [key: string]: unknown }>
): input is OperationDefinitionNode => {
  if (input.kind !== "OperationDefinition" || input.operation !== "query") {
    return false;
  }
  const liveDirective = input.directives?.find((d) => d.name.value === "live");
  if (isNone(liveDirective)) {
    return false;
  }
  const ifArgument = liveDirective.arguments?.find(
    (arg) => arg.name.value === "if"
  );
  if (isNone(ifArgument)) {
    return true;
  }
  if (
    ifArgument.value.kind === "BooleanValue" &&
    ifArgument.value.value === true
  ) {
    return true;
  }
  if (ifArgument.value.kind !== "Variable") {
    return false;
  }
  if (isSome(variables) && isSome(variables[ifArgument.value.name.value])) {
    return Boolean(variables[ifArgument.value.name.value]);
  }

  const variableName = ifArgument.value.name.value;
  const variableNode = input.variableDefinitions?.find(
    (def) => def.variable.name.value === variableName
  );

  if (variableNode?.defaultValue?.kind === "BooleanValue") {
    return variableNode.defaultValue.value;
  }

  return false;
};
