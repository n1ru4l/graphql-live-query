import type {
  SelectionSetNode,
  DocumentNode,
  FieldNode,
  OperationDefinitionNode,
} from "graphql";
import { isNone } from "./Maybe";

type MaybeOperationDefinitionNode = OperationDefinitionNode | null;

const gatherFields = (
  selectionSet: SelectionSetNode,
  documentNode: DocumentNode
): FieldNode[] => {
  const fields = [] as FieldNode[];
  for (const selection of selectionSet.selections) {
    switch (selection.kind) {
      case "Field": {
        fields.push(selection);
        continue;
      }
      case "InlineFragment": {
        fields.push(...gatherFields(selection.selectionSet, documentNode));
        continue;
      }
      case "FragmentSpread": {
        const fragment = (documentNode.definitions.find(
          (definition) =>
            definition.kind === "FragmentDefinition" &&
            definition.name.value === selection.name.value
        ) ?? null) as MaybeOperationDefinitionNode;
        if (isNone(fragment)) {
          // We can abort collecting the identifiers as GraphQL execution will complain.
          break;
        }
        fields.push(...gatherFields(fragment.selectionSet, documentNode));
        continue;
      }
    }
  }
  return fields;
};

/**
 * Returns an array that contains all the root query type field coordinates for a given graphql operation.
 */
export const extractLiveQueryRootFieldCoordinates = (
  documentNode: DocumentNode,
  operationNode: OperationDefinitionNode
) =>
  Array.from(
    new Set(
      gatherFields(operationNode.selectionSet, documentNode).map(
        (field) => `Query.${field.name.value}`
      )
    )
  );
