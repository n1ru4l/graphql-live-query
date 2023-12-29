import { GraphQLError } from "graphql";
import { ValidationRule } from "graphql";
import { getLiveDirectiveNode } from "../getLiveDirectiveNode.js";
import { isNone } from "../Maybe.js";

export const NoLiveMixedWithDeferStreamRule: ValidationRule = (context) => {
  let opmatch = false;
  return {
    OperationDefinition(operationDefinitionNode) {
      if (isNone(getLiveDirectiveNode(operationDefinitionNode))) {
        return false;
      } else {
        opmatch = true;
      }
    },
    Directive(directiveNode) {
      if (
        opmatch && (
          directiveNode.name.value === "defer" ||
          directiveNode.name.value === "stream"
        )
      ) {
        context.reportError(
          new GraphQLError(
            `Cannot mix "@${directiveNode.name.value}" with "@live".`,
            directiveNode.name
          )
        );
      }
    },
  };
};
