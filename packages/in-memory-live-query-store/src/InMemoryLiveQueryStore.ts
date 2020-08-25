import type { DocumentNode, ExecutionResult } from "graphql";
import {
  OperationVariables,
  extractLiveQueries,
} from "@n1ru4l/graphql-live-query";
import {
  extractLiveQueryRootIdentifier,
  LiveQueryStore,
  UnsubscribeHandler,
} from "@n1ru4l/graphql-live-query";

type StoreRecord = {
  publishUpdate: (executionResult: ExecutionResult, payload: any) => void;
  identifier: string[];
  executeQuery: () => Promise<ExecutionResult>;
};

export class InMemoryLiveQueryStore implements LiveQueryStore {
  private _store = new Map<DocumentNode, StoreRecord>();

  register(
    operationDocument: DocumentNode,
    _operationVariables: OperationVariables,
    executeQuery: () => Promise<ExecutionResult>,
    publishUpdate: (executionResult: ExecutionResult, payload: any) => void
  ): UnsubscribeHandler {
    const [liveQuery] = extractLiveQueries(operationDocument);
    if (!liveQuery) {
      throw new Error("Cannot register live query for the given document.");
    }

    const identifier = extractLiveQueryRootIdentifier(liveQuery);
    const record = {
      publishUpdate,
      identifier,
      executeQuery,
    };
    this._store.set(operationDocument, record);
    // Execute initial query
    executeQuery().then((result) => record.publishUpdate(result, result));
    return () => void this._store.delete(operationDocument);
  }

  async triggerUpdate(identifier: string) {
    for (const record of this._store.values()) {
      if (record.identifier.includes(identifier)) {
        const result = await record.executeQuery();
        record.publishUpdate(result, result);
      }
    }
  }
}
