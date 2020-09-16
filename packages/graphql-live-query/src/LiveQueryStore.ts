import type { DocumentNode, ExecutionResult } from "graphql";

export type UnsubscribeHandler = () => void;
export type OperationVariables = { [key: string]: any } | null | undefined;

export type LiveQueryStoreRegisterParameter = {
  operationDocument: DocumentNode;
  operationName: string | null;
  operationVariables: OperationVariables;
  executeOperation: () => Promise<ExecutionResult>;
  publishUpdate: (executionResult: ExecutionResult, payload: any) => void;
};

export abstract class LiveQueryStore {
  abstract async triggerUpdate(identifier: string): Promise<void>;
  abstract register(
    params: LiveQueryStoreRegisterParameter
  ): UnsubscribeHandler;
}
