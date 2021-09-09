/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type Mutation = {
  __typename?: "Mutation";
  todoAdd: TodoAddResult;
  todoChangeContent: TodoChangeContentResult;
  todoDelete: TodoRemoveResult;
  todoToggleIsCompleted: TodoToggleIsCompletedResult;
};

export type MutationTodoAddArgs = {
  content: Scalars["String"];
  id: Scalars["ID"];
};

export type MutationTodoChangeContentArgs = {
  content: Scalars["String"];
  id: Scalars["ID"];
};

export type MutationTodoDeleteArgs = {
  id: Scalars["ID"];
};

export type MutationTodoToggleIsCompletedArgs = {
  id: Scalars["ID"];
};

export type Query = {
  __typename?: "Query";
  todos: Array<Todo>;
};

export type Todo = {
  __typename?: "Todo";
  content: Scalars["String"];
  id: Scalars["ID"];
  isCompleted: Scalars["Boolean"];
};

export type TodoAddResult = {
  __typename?: "TodoAddResult";
  addedTodo: Todo;
};

export type TodoChangeContentResult = {
  __typename?: "TodoChangeContentResult";
  changedTodo: Todo;
};

export type TodoRemoveResult = {
  __typename?: "TodoRemoveResult";
  removedTodoId: Scalars["ID"];
};

export type TodoToggleIsCompletedResult = {
  __typename?: "TodoToggleIsCompletedResult";
  toggledTodo: Todo;
};

export type TodoApplication_TodoFragment = {
  __typename?: "Todo";
  id: string;
  content: string;
  isCompleted: boolean;
};

export type TodoApplication_TodoChangeContentMutationMutationVariables = Exact<{
  id: Scalars["ID"];
  content: Scalars["String"];
}>;

export type TodoApplication_TodoChangeContentMutationMutation = {
  __typename?: "Mutation";
  todoChangeContent: { __typename: "TodoChangeContentResult" };
};

export type TodoApplication_TodoDeleteMutationMutationVariables = Exact<{
  id: Scalars["ID"];
}>;

export type TodoApplication_TodoDeleteMutationMutation = {
  __typename?: "Mutation";
  todoDelete: { __typename: "TodoRemoveResult" };
};

export type TodoApplication_TodoToggleIsCompletedMutationMutationVariables =
  Exact<{
    id: Scalars["ID"];
  }>;

export type TodoApplication_TodoToggleIsCompletedMutationMutation = {
  __typename?: "Mutation";
  todoToggleIsCompleted: { __typename: "TodoToggleIsCompletedResult" };
};

export type TodoApplication_DataFragment = {
  __typename?: "Query";
  todos: Array<{
    __typename?: "Todo";
    id: string;
    content: string;
    isCompleted: boolean;
  }>;
};

export type TodoApplication_TodosQueryQueryVariables = Exact<{
  [key: string]: never;
}>;

export type TodoApplication_TodosQueryQuery = {
  __typename?: "Query";
  todos: Array<{
    __typename?: "Todo";
    id: string;
    content: string;
    isCompleted: boolean;
  }>;
};

export type TodoApplication_TodoAddMutationMutationVariables = Exact<{
  id: Scalars["ID"];
  content: Scalars["String"];
}>;

export type TodoApplication_TodoAddMutationMutation = {
  __typename?: "Mutation";
  todoAdd: { __typename: "TodoAddResult" };
};

export const TodoApplication_TodoFragmentDoc = {
  kind: "Document",
  definitions: [
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "TodoApplication_todo" },
      typeCondition: {
        kind: "NamedType",
        name: { kind: "Name", value: "Todo" },
      },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "content" } },
          { kind: "Field", name: { kind: "Name", value: "isCompleted" } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<TodoApplication_TodoFragment, unknown>;
export const TodoApplication_DataFragmentDoc = {
  kind: "Document",
  definitions: [
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "TodoApplication_data" },
      typeCondition: {
        kind: "NamedType",
        name: { kind: "Name", value: "Query" },
      },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "todos" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                {
                  kind: "FragmentSpread",
                  name: { kind: "Name", value: "TodoApplication_todo" },
                },
              ],
            },
          },
        ],
      },
    },
    ...TodoApplication_TodoFragmentDoc.definitions,
  ],
} as unknown as DocumentNode<TodoApplication_DataFragment, unknown>;
export const TodoApplication_TodoChangeContentMutationDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: {
        kind: "Name",
        value: "TodoApplication_TodoChangeContentMutation",
      },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "id" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "ID" } },
          },
        },
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "content" },
          },
          type: {
            kind: "NonNullType",
            type: {
              kind: "NamedType",
              name: { kind: "Name", value: "String" },
            },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "todoChangeContent" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "id" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "id" },
                },
              },
              {
                kind: "Argument",
                name: { kind: "Name", value: "content" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "content" },
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "__typename" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  TodoApplication_TodoChangeContentMutationMutation,
  TodoApplication_TodoChangeContentMutationMutationVariables
>;
export const TodoApplication_TodoDeleteMutationDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "TodoApplication_TodoDeleteMutation" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "id" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "ID" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "todoDelete" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "id" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "id" },
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "__typename" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  TodoApplication_TodoDeleteMutationMutation,
  TodoApplication_TodoDeleteMutationMutationVariables
>;
export const TodoApplication_TodoToggleIsCompletedMutationDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: {
        kind: "Name",
        value: "TodoApplication_TodoToggleIsCompletedMutation",
      },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "id" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "ID" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "todoToggleIsCompleted" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "id" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "id" },
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "__typename" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  TodoApplication_TodoToggleIsCompletedMutationMutation,
  TodoApplication_TodoToggleIsCompletedMutationMutationVariables
>;
export const TodoApplication_TodosQueryDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "TodoApplication_TodosQuery" },
      directives: [
        { kind: "Directive", name: { kind: "Name", value: "live" } },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "FragmentSpread",
            name: { kind: "Name", value: "TodoApplication_data" },
          },
        ],
      },
    },
    ...TodoApplication_DataFragmentDoc.definitions,
  ],
} as unknown as DocumentNode<
  TodoApplication_TodosQueryQuery,
  TodoApplication_TodosQueryQueryVariables
>;
export const TodoApplication_TodoAddMutationDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "TodoApplication_TodoAddMutation" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "id" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "ID" } },
          },
        },
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "content" },
          },
          type: {
            kind: "NonNullType",
            type: {
              kind: "NamedType",
              name: { kind: "Name", value: "String" },
            },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "todoAdd" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "id" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "id" },
                },
              },
              {
                kind: "Argument",
                name: { kind: "Name", value: "content" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "content" },
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "__typename" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  TodoApplication_TodoAddMutationMutation,
  TodoApplication_TodoAddMutationMutationVariables
>;
