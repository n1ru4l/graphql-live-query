import { DirectiveNode, getDirectiveValues } from "graphql";
import { GraphQLLiveDirective } from "./GraphQLLiveDirective.js";
import { Maybe } from "./Maybe.js";

export const getLiveDirectiveArgumentValues = (
  node: DirectiveNode,
  variableValues?: Maybe<{ [key: string]: unknown }>
): {
  isLive: boolean;
  throttleValue: Maybe<number>;
} => {
  const values = getDirectiveValues(
    GraphQLLiveDirective,
    { directives: [node] },
    variableValues
  );

  return {
    isLive: values?.["if"] === true,
    throttleValue: (values?.["throttle"] ?? null) as Maybe<number>,
  };
};
