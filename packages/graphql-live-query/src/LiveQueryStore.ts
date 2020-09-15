import type { DocumentNode, ExecutionResult } from "graphql";

export type UnsubscribeHandler = () => void;
export type OperationVariables = { [key: string]: any } | null | undefined;

export abstract class LiveQueryStore {
  abstract async triggerUpdate(identifier: string): Promise<void>;
  abstract register(
    operationDocument: DocumentNode,
    operationName: string | null,
    operationVariables: OperationVariables,
    executeQuery: () => Promise<ExecutionResult>,
    publishUpdate: (executionResult: ExecutionResult, payload: any) => void
  ): UnsubscribeHandler;
}
