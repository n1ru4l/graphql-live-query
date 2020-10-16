import type { DocumentNode, ExecutionResult, GraphQLSchema } from "graphql";
import { Maybe } from "./Maybe";

export type OperationVariables = { [key: string]: any };

export type ExecuteLiveQueryParameter = {
  schema: GraphQLSchema;
  document: DocumentNode;
  rootValue?: unknown;
  contextValue?: unknown;
  variableValues?: Maybe<OperationVariables>;
  operationName: Maybe<string>;
};

export type ExecuteLiveQueryFunction = (
  params: ExecuteLiveQueryParameter
) => Promise<AsyncIterableIterator<ExecutionResult> | ExecutionResult>;
