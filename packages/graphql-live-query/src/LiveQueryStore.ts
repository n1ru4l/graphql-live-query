import type { DocumentNode, ExecutionResult, GraphQLSchema } from "graphql";

export type UnsubscribeHandler = () => void;
export type OperationVariables = { [key: string]: any } | null | undefined;

export type LiveQueryStoreRegisterParameter = {
  schema: GraphQLSchema;
  operationDocument: DocumentNode;
  operationName: string | null;
  operationVariables: OperationVariables;
  rootValue: unknown;
  contextValue: unknown;
  publishUpdate: (executionResult: ExecutionResult, payload: any) => void;
};

export abstract class LiveQueryStore {
  abstract async triggerUpdate(identifier: string): Promise<void>;
  abstract register(
    params: LiveQueryStoreRegisterParameter
  ): UnsubscribeHandler;
}
