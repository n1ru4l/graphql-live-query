/* eslint-disable */
import * as graphql from "./graphql.js";
import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";

const documents = {
  "\n  fragment TodoApplication_todo on Todo {\n    id\n    content\n    isCompleted\n  }\n":
    graphql.TodoApplication_TodoFragmentDoc,
  "\n  mutation TodoApplication_TodoChangeContentMutation(\n    $id: ID!\n    $content: String!\n  ) {\n    todoChangeContent(id: $id, content: $content) {\n      __typename\n    }\n  }\n":
    graphql.TodoApplication_TodoChangeContentMutationDocument,
  "\n  mutation TodoApplication_TodoDeleteMutation($id: ID!) {\n    todoDelete(id: $id) {\n      __typename\n    }\n  }\n":
    graphql.TodoApplication_TodoDeleteMutationDocument,
  "\n  mutation TodoApplication_TodoToggleIsCompletedMutation($id: ID!) {\n    todoToggleIsCompleted(id: $id) {\n      __typename\n    }\n  }\n":
    graphql.TodoApplication_TodoToggleIsCompletedMutationDocument,
  "\n  fragment TodoApplication_data on Query {\n    todos {\n      id\n      ...TodoApplication_todo\n    }\n  }\n":
    graphql.TodoApplication_DataFragmentDoc,
  "\n  query TodoApplication_TodosQuery @live {\n    ...TodoApplication_data\n  }\n":
    graphql.TodoApplication_TodosQueryDocument,
  "\n  mutation TodoApplication_TodoAddMutation($id: ID!, $content: String!) {\n    todoAdd(id: $id, content: $content) {\n      __typename\n    }\n  }\n":
    graphql.TodoApplication_TodoAddMutationDocument,
};

export function gql(
  source: "\n  fragment TodoApplication_todo on Todo {\n    id\n    content\n    isCompleted\n  }\n"
): typeof documents["\n  fragment TodoApplication_todo on Todo {\n    id\n    content\n    isCompleted\n  }\n"];
export function gql(
  source: "\n  mutation TodoApplication_TodoChangeContentMutation(\n    $id: ID!\n    $content: String!\n  ) {\n    todoChangeContent(id: $id, content: $content) {\n      __typename\n    }\n  }\n"
): typeof documents["\n  mutation TodoApplication_TodoChangeContentMutation(\n    $id: ID!\n    $content: String!\n  ) {\n    todoChangeContent(id: $id, content: $content) {\n      __typename\n    }\n  }\n"];
export function gql(
  source: "\n  mutation TodoApplication_TodoDeleteMutation($id: ID!) {\n    todoDelete(id: $id) {\n      __typename\n    }\n  }\n"
): typeof documents["\n  mutation TodoApplication_TodoDeleteMutation($id: ID!) {\n    todoDelete(id: $id) {\n      __typename\n    }\n  }\n"];
export function gql(
  source: "\n  mutation TodoApplication_TodoToggleIsCompletedMutation($id: ID!) {\n    todoToggleIsCompleted(id: $id) {\n      __typename\n    }\n  }\n"
): typeof documents["\n  mutation TodoApplication_TodoToggleIsCompletedMutation($id: ID!) {\n    todoToggleIsCompleted(id: $id) {\n      __typename\n    }\n  }\n"];
export function gql(
  source: "\n  fragment TodoApplication_data on Query {\n    todos {\n      id\n      ...TodoApplication_todo\n    }\n  }\n"
): typeof documents["\n  fragment TodoApplication_data on Query {\n    todos {\n      id\n      ...TodoApplication_todo\n    }\n  }\n"];
export function gql(
  source: "\n  query TodoApplication_TodosQuery @live {\n    ...TodoApplication_data\n  }\n"
): typeof documents["\n  query TodoApplication_TodosQuery @live {\n    ...TodoApplication_data\n  }\n"];
export function gql(
  source: "\n  mutation TodoApplication_TodoAddMutation($id: ID!, $content: String!) {\n    todoAdd(id: $id, content: $content) {\n      __typename\n    }\n  }\n"
): typeof documents["\n  mutation TodoApplication_TodoAddMutation($id: ID!, $content: String!) {\n    todoAdd(id: $id, content: $content) {\n      __typename\n    }\n  }\n"];

export function gql(source: string): unknown;
export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never;
