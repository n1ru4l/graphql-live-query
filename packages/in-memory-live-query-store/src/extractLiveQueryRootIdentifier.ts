import type {
  SelectionSetNode,
  DocumentNode,
  FieldNode,
  OperationDefinitionNode,
} from "graphql";

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
        if (!fragment) {
          throw new Error(`Could not find fragment '${selection.name.value}'.`);
        }
        fields.push(...gatherFields(fragment.selectionSet, documentNode));
        continue;
      }
    }
  }
  return fields;
};

/**
 * Returns an array that contains all the root query type field selections for a given graphql operation.
 */
export const extractLiveQueryRootIdentifier = (
  documentNode: DocumentNode,
  operationName?: string
) => {
  let operation: OperationDefinitionNode | null = null;
  if (!operationName) {
    operation = (documentNode.definitions.find(
      (definition) =>
        definition.kind === "OperationDefinition" &&
        definition.operation === "query"
    ) ?? null) as MaybeOperationDefinitionNode;
  } else {
    operation = (documentNode.definitions.find(
      (definition) =>
        definition.kind === "OperationDefinition" &&
        definition.name?.value === operationName
    ) ?? null) as MaybeOperationDefinitionNode;
  }

  if (!operation) {
    throw new Error("Could not identify the live query operation.");
  }

  return Array.from(
    new Set(
      gatherFields(operation.selectionSet, documentNode).map(
        (field) => `Query.${field.name.value}`
      )
    )
  );
};
