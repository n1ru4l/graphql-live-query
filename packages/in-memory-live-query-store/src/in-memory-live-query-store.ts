import type { OperationDefinitionNode, ExecutionResult } from "graphql";
import {
  extractLiveQueryRootIdentifier,
  LiveQueryStore,
} from "@n1ru4l/graphql-live-query";

type StoreRecord = {
  publishUpdate: (patch: ExecutionResult) => void;
  identifier: string[];
  executeQuery: () => Promise<ExecutionResult>;
};

export class InMemoryLiveQueryStore implements LiveQueryStore {
  private _store = new Map<OperationDefinitionNode, StoreRecord>();

  register(
    document: OperationDefinitionNode,
    executeQuery: () => Promise<ExecutionResult>,
    publishUpdate: (patch: ExecutionResult) => void
  ) {
    const identifier = extractLiveQueryRootIdentifier(document);
    const record = {
      publishUpdate,
      identifier,
      executeQuery,
    };
    this._store.set(document, record);
    // Execute initial query
    executeQuery().then(record.publishUpdate);
    return () => void this._store.delete(document);
  }

  async triggerUpdate(identifier: string) {
    for (const record of this._store.values()) {
      if (record.identifier.includes(identifier)) {
        const result = await record.executeQuery();
        record.publishUpdate(result);
      }
    }
  }
}
