import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
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
export type TodoApplication_TodoAddMutationMutationFn = Apollo.MutationFunction<TodoApplication_TodoAddMutationMutation, TodoApplication_TodoAddMutationMutationVariables>;

/**
 * __useTodoApplication_TodoAddMutationMutation__
 *
 * To run a mutation, you first call `useTodoApplication_TodoAddMutationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useTodoApplication_TodoAddMutationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [todoApplicationTodoAddMutationMutation, { data, loading, error }] = useTodoApplication_TodoAddMutationMutation({
 *   variables: {
 *      id: // value for 'id'
 *      content: // value for 'content'
 *   },
 * });
 */
export function useTodoApplication_TodoAddMutationMutation(baseOptions?: Apollo.MutationHookOptions<TodoApplication_TodoAddMutationMutation, TodoApplication_TodoAddMutationMutationVariables>) {
        return Apollo.useMutation<TodoApplication_TodoAddMutationMutation, TodoApplication_TodoAddMutationMutationVariables>(TodoApplication_TodoAddMutationDocument, baseOptions);
      }
export type TodoApplication_TodoAddMutationMutationHookResult = ReturnType<typeof useTodoApplication_TodoAddMutationMutation>;
export type TodoApplication_TodoAddMutationMutationResult = Apollo.MutationResult<TodoApplication_TodoAddMutationMutation>;
export type TodoApplication_TodoAddMutationMutationOptions = Apollo.BaseMutationOptions<TodoApplication_TodoAddMutationMutation, TodoApplication_TodoAddMutationMutationVariables>;
export const TodoApplication_TodoChangeContentMutationDocument = gql`
    mutation TodoApplication_TodoChangeContentMutation($id: ID!, $content: String!) {
  todoChangeContent(id: $id, content: $content) {
    __typename
  }
}
    `;
export type TodoApplication_TodoChangeContentMutationMutationFn = Apollo.MutationFunction<TodoApplication_TodoChangeContentMutationMutation, TodoApplication_TodoChangeContentMutationMutationVariables>;

/**
 * __useTodoApplication_TodoChangeContentMutationMutation__
 *
 * To run a mutation, you first call `useTodoApplication_TodoChangeContentMutationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useTodoApplication_TodoChangeContentMutationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [todoApplicationTodoChangeContentMutationMutation, { data, loading, error }] = useTodoApplication_TodoChangeContentMutationMutation({
 *   variables: {
 *      id: // value for 'id'
 *      content: // value for 'content'
 *   },
 * });
 */
export function useTodoApplication_TodoChangeContentMutationMutation(baseOptions?: Apollo.MutationHookOptions<TodoApplication_TodoChangeContentMutationMutation, TodoApplication_TodoChangeContentMutationMutationVariables>) {
        return Apollo.useMutation<TodoApplication_TodoChangeContentMutationMutation, TodoApplication_TodoChangeContentMutationMutationVariables>(TodoApplication_TodoChangeContentMutationDocument, baseOptions);
      }
export type TodoApplication_TodoChangeContentMutationMutationHookResult = ReturnType<typeof useTodoApplication_TodoChangeContentMutationMutation>;
export type TodoApplication_TodoChangeContentMutationMutationResult = Apollo.MutationResult<TodoApplication_TodoChangeContentMutationMutation>;
export type TodoApplication_TodoChangeContentMutationMutationOptions = Apollo.BaseMutationOptions<TodoApplication_TodoChangeContentMutationMutation, TodoApplication_TodoChangeContentMutationMutationVariables>;
export const TodoApplication_TodoDeleteMutationDocument = gql`
    mutation TodoApplication_TodoDeleteMutation($id: ID!) {
  todoDelete(id: $id) {
    __typename
  }
}
    `;
export type TodoApplication_TodoDeleteMutationMutationFn = Apollo.MutationFunction<TodoApplication_TodoDeleteMutationMutation, TodoApplication_TodoDeleteMutationMutationVariables>;

/**
 * __useTodoApplication_TodoDeleteMutationMutation__
 *
 * To run a mutation, you first call `useTodoApplication_TodoDeleteMutationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useTodoApplication_TodoDeleteMutationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [todoApplicationTodoDeleteMutationMutation, { data, loading, error }] = useTodoApplication_TodoDeleteMutationMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useTodoApplication_TodoDeleteMutationMutation(baseOptions?: Apollo.MutationHookOptions<TodoApplication_TodoDeleteMutationMutation, TodoApplication_TodoDeleteMutationMutationVariables>) {
        return Apollo.useMutation<TodoApplication_TodoDeleteMutationMutation, TodoApplication_TodoDeleteMutationMutationVariables>(TodoApplication_TodoDeleteMutationDocument, baseOptions);
      }
export type TodoApplication_TodoDeleteMutationMutationHookResult = ReturnType<typeof useTodoApplication_TodoDeleteMutationMutation>;
export type TodoApplication_TodoDeleteMutationMutationResult = Apollo.MutationResult<TodoApplication_TodoDeleteMutationMutation>;
export type TodoApplication_TodoDeleteMutationMutationOptions = Apollo.BaseMutationOptions<TodoApplication_TodoDeleteMutationMutation, TodoApplication_TodoDeleteMutationMutationVariables>;
export const TodoApplication_TodoToggleIsCompletedMutationDocument = gql`
    mutation TodoApplication_TodoToggleIsCompletedMutation($id: ID!) {
  todoToggleIsCompleted(id: $id) {
    __typename
  }
}
    `;
export type TodoApplication_TodoToggleIsCompletedMutationMutationFn = Apollo.MutationFunction<TodoApplication_TodoToggleIsCompletedMutationMutation, TodoApplication_TodoToggleIsCompletedMutationMutationVariables>;

/**
 * __useTodoApplication_TodoToggleIsCompletedMutationMutation__
 *
 * To run a mutation, you first call `useTodoApplication_TodoToggleIsCompletedMutationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useTodoApplication_TodoToggleIsCompletedMutationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [todoApplicationTodoToggleIsCompletedMutationMutation, { data, loading, error }] = useTodoApplication_TodoToggleIsCompletedMutationMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useTodoApplication_TodoToggleIsCompletedMutationMutation(baseOptions?: Apollo.MutationHookOptions<TodoApplication_TodoToggleIsCompletedMutationMutation, TodoApplication_TodoToggleIsCompletedMutationMutationVariables>) {
        return Apollo.useMutation<TodoApplication_TodoToggleIsCompletedMutationMutation, TodoApplication_TodoToggleIsCompletedMutationMutationVariables>(TodoApplication_TodoToggleIsCompletedMutationDocument, baseOptions);
      }
export type TodoApplication_TodoToggleIsCompletedMutationMutationHookResult = ReturnType<typeof useTodoApplication_TodoToggleIsCompletedMutationMutation>;
export type TodoApplication_TodoToggleIsCompletedMutationMutationResult = Apollo.MutationResult<TodoApplication_TodoToggleIsCompletedMutationMutation>;
export type TodoApplication_TodoToggleIsCompletedMutationMutationOptions = Apollo.BaseMutationOptions<TodoApplication_TodoToggleIsCompletedMutationMutation, TodoApplication_TodoToggleIsCompletedMutationMutationVariables>;
export const TodoApplication_TodosQueryDocument = gql`
    query TodoApplication_TodosQuery @live {
  ...TodoApplication_data
}
    ${TodoApplication_DataFragmentDoc}`;

/**
 * __useTodoApplication_TodosQueryQuery__
 *
 * To run a query within a React component, call `useTodoApplication_TodosQueryQuery` and pass it any options that fit your needs.
 * When your component renders, `useTodoApplication_TodosQueryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTodoApplication_TodosQueryQuery({
 *   variables: {
 *   },
 * });
 */
export function useTodoApplication_TodosQueryQuery(baseOptions?: Apollo.QueryHookOptions<TodoApplication_TodosQueryQuery, TodoApplication_TodosQueryQueryVariables>) {
        return Apollo.useQuery<TodoApplication_TodosQueryQuery, TodoApplication_TodosQueryQueryVariables>(TodoApplication_TodosQueryDocument, baseOptions);
      }
export function useTodoApplication_TodosQueryLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TodoApplication_TodosQueryQuery, TodoApplication_TodosQueryQueryVariables>) {
          return Apollo.useLazyQuery<TodoApplication_TodosQueryQuery, TodoApplication_TodosQueryQueryVariables>(TodoApplication_TodosQueryDocument, baseOptions);
        }
export type TodoApplication_TodosQueryQueryHookResult = ReturnType<typeof useTodoApplication_TodosQueryQuery>;
export type TodoApplication_TodosQueryLazyQueryHookResult = ReturnType<typeof useTodoApplication_TodosQueryLazyQuery>;
export type TodoApplication_TodosQueryQueryResult = Apollo.QueryResult<TodoApplication_TodosQueryQuery, TodoApplication_TodosQueryQueryVariables>;