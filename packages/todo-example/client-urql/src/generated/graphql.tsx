import gql from 'graphql-tag';
import * as Urql from 'urql';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};


export type Query = {
  __typename?: 'Query';
  todos: Array<Todo>;
};

export type Todo = {
  __typename?: 'Todo';
  id: Scalars['ID'];
  content: Scalars['String'];
  isCompleted: Scalars['Boolean'];
};

export type Mutation = {
  __typename?: 'Mutation';
  todoAdd: TodoAddResult;
  todoDelete: TodoRemoveResult;
  todoToggleIsCompleted: TodoToggleIsCompletedResult;
  todoChangeContent: TodoChangeContentResult;
};


export type MutationTodoAddArgs = {
  id: Scalars['ID'];
  content: Scalars['String'];
};


export type MutationTodoDeleteArgs = {
  id: Scalars['ID'];
};


export type MutationTodoToggleIsCompletedArgs = {
  id: Scalars['ID'];
};


export type MutationTodoChangeContentArgs = {
  id: Scalars['ID'];
  content: Scalars['String'];
};

export type TodoAddResult = {
  __typename?: 'TodoAddResult';
  addedTodo: Todo;
};

export type TodoRemoveResult = {
  __typename?: 'TodoRemoveResult';
  removedTodoId: Scalars['ID'];
};

export type TodoToggleIsCompletedResult = {
  __typename?: 'TodoToggleIsCompletedResult';
  toggledTodo: Todo;
};

export type TodoChangeContentResult = {
  __typename?: 'TodoChangeContentResult';
  changedTodo: Todo;
};

export type TodoApplication_TodoAddMutationMutationVariables = Exact<{
  id: Scalars['ID'];
  content: Scalars['String'];
}>;


export type TodoApplication_TodoAddMutationMutation = (
  { __typename?: 'Mutation' }
  & { todoAdd: { __typename: 'TodoAddResult' } }
);

export type TodoApplication_TodoChangeContentMutationMutationVariables = Exact<{
  id: Scalars['ID'];
  content: Scalars['String'];
}>;


export type TodoApplication_TodoChangeContentMutationMutation = (
  { __typename?: 'Mutation' }
  & { todoChangeContent: { __typename: 'TodoChangeContentResult' } }
);

export type TodoApplication_TodoDeleteMutationMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type TodoApplication_TodoDeleteMutationMutation = (
  { __typename?: 'Mutation' }
  & { todoDelete: { __typename: 'TodoRemoveResult' } }
);

export type TodoApplication_TodoToggleIsCompletedMutationMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type TodoApplication_TodoToggleIsCompletedMutationMutation = (
  { __typename?: 'Mutation' }
  & { todoToggleIsCompleted: { __typename: 'TodoToggleIsCompletedResult' } }
);

export type TodoApplication_TodosQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type TodoApplication_TodosQueryQuery = (
  { __typename?: 'Query' }
  & TodoApplication_DataFragment
);

export type TodoApplication_DataFragment = (
  { __typename?: 'Query' }
  & { todos: Array<(
    { __typename?: 'Todo' }
    & Pick<Todo, 'id'>
    & TodoApplication_TodoFragment
  )> }
);

export type TodoApplication_TodoFragment = (
  { __typename?: 'Todo' }
  & Pick<Todo, 'id' | 'content' | 'isCompleted'>
);

export const TodoApplication_TodoFragmentDoc = gql`
    fragment TodoApplication_todo on Todo {
  id
  content
  isCompleted
}
    `;
export const TodoApplication_DataFragmentDoc = gql`
    fragment TodoApplication_data on Query {
  todos {
    id
    ...TodoApplication_todo
  }
}
    ${TodoApplication_TodoFragmentDoc}`;
export const TodoApplication_TodoAddMutationDocument = gql`
    mutation TodoApplication_TodoAddMutation($id: ID!, $content: String!) {
  todoAdd(id: $id, content: $content) {
    __typename
  }
}
    `;

export function useTodoApplication_TodoAddMutationMutation() {
  return Urql.useMutation<TodoApplication_TodoAddMutationMutation, TodoApplication_TodoAddMutationMutationVariables>(TodoApplication_TodoAddMutationDocument);
};
export const TodoApplication_TodoChangeContentMutationDocument = gql`
    mutation TodoApplication_TodoChangeContentMutation($id: ID!, $content: String!) {
  todoChangeContent(id: $id, content: $content) {
    __typename
  }
}
    `;

export function useTodoApplication_TodoChangeContentMutationMutation() {
  return Urql.useMutation<TodoApplication_TodoChangeContentMutationMutation, TodoApplication_TodoChangeContentMutationMutationVariables>(TodoApplication_TodoChangeContentMutationDocument);
};
export const TodoApplication_TodoDeleteMutationDocument = gql`
    mutation TodoApplication_TodoDeleteMutation($id: ID!) {
  todoDelete(id: $id) {
    __typename
  }
}
    `;

export function useTodoApplication_TodoDeleteMutationMutation() {
  return Urql.useMutation<TodoApplication_TodoDeleteMutationMutation, TodoApplication_TodoDeleteMutationMutationVariables>(TodoApplication_TodoDeleteMutationDocument);
};
export const TodoApplication_TodoToggleIsCompletedMutationDocument = gql`
    mutation TodoApplication_TodoToggleIsCompletedMutation($id: ID!) {
  todoToggleIsCompleted(id: $id) {
    __typename
  }
}
    `;

export function useTodoApplication_TodoToggleIsCompletedMutationMutation() {
  return Urql.useMutation<TodoApplication_TodoToggleIsCompletedMutationMutation, TodoApplication_TodoToggleIsCompletedMutationMutationVariables>(TodoApplication_TodoToggleIsCompletedMutationDocument);
};
export const TodoApplication_TodosQueryDocument = gql`
    query TodoApplication_TodosQuery @live {
  ...TodoApplication_data
}
    ${TodoApplication_DataFragmentDoc}`;

export function useTodoApplication_TodosQueryQuery(options: Omit<Urql.UseQueryArgs<TodoApplication_TodosQueryQueryVariables>, 'query'> = {}) {
  return Urql.useQuery<TodoApplication_TodosQueryQuery>({ query: TodoApplication_TodosQueryDocument, ...options });
};