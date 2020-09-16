import type { DocumentNode, ExecutionResult } from "graphql";
import {
  extractLiveQueries,
  LiveQueryStore,
  LiveQueryStoreRegisterParameter,
  UnsubscribeHandler,
} from "@n1ru4l/graphql-live-query";
import { extractLiveQueryRootFieldCoordinates } from "./extractLiveQueryRootFieldCoordinates";

type StoreRecord = {
  publishUpdate: (executionResult: ExecutionResult, payload: any) => void;
  identifier: string[];
  executeOperation: () => Promise<ExecutionResult>;
};

export class InMemoryLiveQueryStore implements LiveQueryStore {
  private _store = new Map<DocumentNode, StoreRecord>();

  register({
    operationDocument,
    operationName,
    executeOperation,
    publishUpdate,
  }: LiveQueryStoreRegisterParameter): UnsubscribeHandler {
    const [liveQuery] = extractLiveQueries(operationDocument);
    if (!liveQuery) {
      throw new Error("Cannot register live query for the given document.");
    }

    const identifier = extractLiveQueryRootFieldCoordinates(
      operationDocument,
      operationName
    );
    const record = {
      publishUpdate,
      identifier,
      executeOperation,
    };
    this._store.set(operationDocument, record);
    // Execute initial query
    executeOperation().then((result) => record.publishUpdate(result, result));
    return () => void this._store.delete(operationDocument);
  }

  async triggerUpdate(identifier: string) {
    for (const record of this._store.values()) {
      if (record.identifier.includes(identifier)) {
        const result = await record.executeOperation();
        record.publishUpdate(result, result);
      }
    }
  }
}
