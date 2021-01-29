import type {
  SelectionSetNode,
  DocumentNode,
  FieldNode,
  OperationDefinitionNode,
  VariableDefinitionNode,
} from "graphql";
import { isNone, isSome, Maybe } from "./Maybe";

type MaybeOperationDefinitionNode = OperationDefinitionNode | null;

const gatherFields = (
  selectionSet: SelectionSetNode,
  documentNode: DocumentNode
): FieldNode[] => {
  const fields = [] as FieldNode[];
  for (const selection of selectionSet.selections) {
    switch (selection.kind) {
      case "Field": {
        selection.arguments?.filter((arg) => arg.value.kind === "Variable");
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
  operationNode: OperationDefinitionNode,
  variableValues?: Maybe<Record<string, unknown>>
) => {
  const identifier = new Set<string>();
  const idVariablesLookupMap = new Map<string, string>();

  if (isSome(operationNode.variableDefinitions) && isSome(variableValues)) {
    collectIdVariableValues(
      operationNode.variableDefinitions,
      variableValues,
      idVariablesLookupMap
    );
  }

  const fields = gatherFields(operationNode.selectionSet, documentNode);
  for (const field of fields) {
    identifier.add(`Query.${field.name.value}`);
    if (isSome(field.arguments)) {
      for (const arg of field.arguments) {
        if (
          arg.value.kind === "Variable" &&
          idVariablesLookupMap.has(arg.value.name.value)
        ) {
          identifier.add(
            // prettier-ignore
            `Query.${field.name.value}(${arg.name.value}:"${idVariablesLookupMap.get(arg.value.name.value)}")`
          );
        }
      }
    }
  }

  return identifier;
};

const collectIdVariableValues = (
  definitions: ReadonlyArray<VariableDefinitionNode>,
  variableValues: Record<string, unknown>,
  lookupMap: Map<string, string>
): void => {
  for (const def of definitions) {
    if (
      def.type.kind == "NonNullType" &&
      def.type.type.kind === "NamedType" &&
      def.type.type.name.value === "ID"
    ) {
      const name = def.variable.name.value;
      if (lookupMap.has(name)) {
        continue;
      }
      lookupMap.set(name, variableValues[name] as string);
    }
  }
};
