import { GraphQLError, ValidationRule } from "@graphql-tools/graphql";
import { getLiveDirectiveNode } from "../getLiveDirectiveNode.js";
import { isNone } from "../Maybe.js";

export const NoLiveMixedWithDeferStreamRule: ValidationRule = (context) => {
  return {
    OperationDefinition(operationDefinitionNode) {
      if (isNone(getLiveDirectiveNode(operationDefinitionNode))) {
        return false;
      }
    },
    Directive(directiveNode) {
      if (
        directiveNode.name.value === "defer" ||
        directiveNode.name.value === "stream"
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
