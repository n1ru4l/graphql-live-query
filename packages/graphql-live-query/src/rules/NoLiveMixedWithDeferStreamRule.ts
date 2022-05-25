import { GraphQLError } from "graphql";
import { ValidationRule } from "graphql";
import { getLiveDirectiveNode } from "../getLiveDirectiveNode";
import { isNone } from "../Maybe";

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
            {
              nodes: directiveNode.name,
            }
          )
        );
      }
    },
  };
};
