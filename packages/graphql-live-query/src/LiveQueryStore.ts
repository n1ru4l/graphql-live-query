import { OperationDefinitionNode, ExecutionResult } from "graphql";

type UnsubscribeHandler = () => void;

export abstract class LiveQueryStore {
  abstract async triggerUpdate(identifier: string): Promise<void>;
  abstract register(
    document: OperationDefinitionNode,
    executeQuery: () => Promise<ExecutionResult>,
    publishUpdate: (patch: ExecutionResult) => void
  ): UnsubscribeHandler;
}
