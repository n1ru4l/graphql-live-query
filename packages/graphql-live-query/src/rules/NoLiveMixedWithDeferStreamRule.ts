import { GraphQLError } from "graphql";
import { ValidationRule } from "graphql";
import { isLiveQueryOperationDefinitionNode } from "../isLiveQueryOperationDefinitionNode";

export const NoLiveMixedWithDeferStreamRule: ValidationRule = (context) => {
  return {
    OperationDefinition(operationDefinitionNode) {
      if (
        isLiveQueryOperationDefinitionNode(operationDefinitionNode) === false
      ) {
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
