import type { DefinitionNode } from "graphql";
import { isSome, isNone, Maybe } from "./Maybe";
import { GraphQLError, print } from "graphql";
import { isLiveQueryOperationDefinitionNode } from "./isLiveQueryOperationDefinitionNode";

// As per the GraphQL Spec, Integers are only treated as valid when a valid
// 32-bit signed integer, providing the broadest support across platforms.
//
// n.b. JavaScript's integers are safe between -(2^53 - 1) and 2^53 - 1 because
// they are internally represented as IEEE 754 doubles.
const MAX_INT = 2147483647;
const MIN_INT = -2147483648;

function checkRange(name: string, value: number): number {
  if (value > MAX_INT || value < MIN_INT) {
    throw new GraphQLError(
      `${name} value cannot represent a non 32-bit signed integer value: ${value}`,
    );
  }
  return value;
}

function coerceVariable(name: string, inputValue: unknown): number {
  if (typeof inputValue !== 'number' || !Number.isInteger(inputValue)) {
    throw new GraphQLError(
      `${name} value is not an integer : ${inputValue}`,
    );
  }
  return checkRange(name, inputValue);
}

export const getLiveQueryOperationThrottle = (
  input: DefinitionNode,
  variables?: Maybe<{ [key: string]: unknown }>
): Maybe<number> => {
  if (!isLiveQueryOperationDefinitionNode(input)) {
    return undefined;
  }
  const liveDirective = input.directives?.find((d) => d.name.value === "live");
  if (isNone(liveDirective)) {
    return undefined;
  }
  const throttleArgument = liveDirective.arguments?.find(
    (arg) => arg.name.value === "throttle"
  );
  if (isNone(throttleArgument)) {
    return undefined;
  }
  const valueNode = throttleArgument.value;
  if (valueNode.kind === "IntValue") {
    return checkRange('throttle', parseInt(valueNode.value, 10));
  }
  if (valueNode.kind !== "Variable") {
    throw new GraphQLError(
      `Throttle is not an int or a variable: ${print(valueNode)}`,
      valueNode,
    );
  }

  const variableName = valueNode.name.value;

  if (isSome(variables) && isSome(variables[variableName])) {
    return coerceVariable(variableName, variables[variableName]);
  }

  const variableNode = input.variableDefinitions?.find(
    (def) => def.variable.name.value === variableName
  );

  if (variableNode?.defaultValue?.kind === "IntValue") {
    return coerceVariable(variableName, variableNode.defaultValue.value);
  }

  throw new GraphQLError(
    `throttle cannot represent non-integer values: ${print(valueNode)}`,
    valueNode,
  );
};
