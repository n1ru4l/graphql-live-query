import * as graphql from "graphql";

const isFieldSelectionSet = (
  selection: graphql.SelectionNode
): selection is graphql.FieldNode => selection.kind === "Field";

// TODO: also support fragments
export const extractLiveQueryRootIdentifier = (
  queryDefinition: graphql.OperationDefinitionNode
) =>
  queryDefinition.selectionSet.selections
    .filter(isFieldSelectionSet)
    .map((field) => `Query.${field.name.value}`);
