import {
  SelectionSetNode,
  DocumentNode,
  FieldNode,
  OperationDefinitionNode,
  TypeInfo,
  visitWithTypeInfo,
  visit,
  getArgumentValues,
} from "@graphql-tools/graphql";
import { isNone, isSome, Maybe } from "./Maybe.js";

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
export const extractLiveQueryRootFieldCoordinates = (params: {
  documentNode: DocumentNode;
  operationNode: OperationDefinitionNode;
  typeInfo: TypeInfo;
  variableValues?: Maybe<Record<string, unknown>>;
}) => {
  const identifier = new Set<string>();
  visit(
    params.documentNode,
    visitWithTypeInfo(params.typeInfo, {
      Field(fieldNode) {
        const parentType = params.typeInfo.getParentType();
        if (
          isSome(parentType) &&
          parentType.name === "Query" &&
          isSome(fieldNode.arguments?.length)
        ) {
          const fieldDef = params.typeInfo.getFieldDef();
          identifier.add(`Query.${fieldNode.name.value}`);
          if (isSome(fieldDef)) {
            for (const arg of fieldDef.args) {
              if (arg.name === "id") {
                const fieldSDLType = arg.type.toString();
                if (fieldSDLType === "ID!" || fieldSDLType === "ID") {
                  const values = getArgumentValues(
                    fieldDef,
                    fieldNode,
                    params.variableValues
                  );
                  identifier.add(
                    `Query.${fieldNode.name.value}(${arg.name}:"${values["id"]}")`
                  );
                }
                break;
              }
            }
          }
        }
      },
    })
  );

  return identifier;
};
