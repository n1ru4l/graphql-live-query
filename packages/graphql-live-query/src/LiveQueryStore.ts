import { OperationDefinitionNode, ExecutionResult } from "graphql";

export type UnsubscribeHandler = () => void;

export abstract class LiveQueryStore {
  abstract async triggerUpdate(identifier: string): Promise<void>;
  abstract register(
    document: OperationDefinitionNode,
    executeQuery: () => Promise<ExecutionResult>,
    publishUpdate: (patch: ExecutionResult) => void
  ): UnsubscribeHandler;
}
