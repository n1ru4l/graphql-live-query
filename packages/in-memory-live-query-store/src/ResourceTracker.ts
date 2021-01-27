import { isNone } from "./Maybe";

/**
 * ResourceTracker is a ad hoc system for tracking events associated with a record.
 * A record can be tracked with a set of events. In case the set of events change,
 * the list can be updated. By calling the `track` method with the previous and
 * new event identifiers. A set of all records that subscribe to a sepecific event
 * can be retrieved with the `getRecordsForIdentifiers` method.
 */
export class ResourceTracker<TRecord> {
  private _trackedResources: Map<string, Set<TRecord>>;
  constructor() {
    this._trackedResources = new Map();
  }

  /**
   * Track a record by its identifiers
   */
  track(
    record: TRecord,
    /* the previous identifiers that should get released */
    previousIdentifier: Set<string>,
    /* the current identifiers that should be tracked */
    currentIdentifier: Set<string>
  ): void {
    for (const identifier of previousIdentifier) {
      if (currentIdentifier.has(identifier)) {
        continue;
      }
      let set = this._trackedResources.get(identifier);
      if (!set) {
        continue;
      }
      set.delete(record);
      if (set.size === 0) {
        this._trackedResources.delete(identifier);
      }
    }
    for (const identifier of currentIdentifier) {
      if (previousIdentifier.has(identifier)) {
        continue;
      }
      let set = this._trackedResources.get(identifier);
      if (isNone(set)) {
        set = new Set();
        this._trackedResources.set(identifier, set);
      }
      set.add(record);
    }
  }

  /**
   * Release a record that subscribes to a specific set of identifiers
   */
  release(record: TRecord, identifiers: Set<string>): void {
    for (const identifier of identifiers) {
      const records = this._trackedResources.get(identifier);
      if (!records) {
        continue;
      }
      records.delete(record);
      if (records.size === 0) {
        this._trackedResources.delete(identifier);
      }
    }
  }

  /**
   * Get all records that subscribes to a specific set of identifiers
   */
  getRecordsForIdentifiers(identifiers: Array<string>): Set<TRecord> {
    const records = new Set<TRecord>();
    for (const identifier of identifiers) {
      const recordSet = this._trackedResources.get(identifier);
      if (recordSet) {
        for (const record of recordSet) {
          records.add(record);
        }
      }
    }

    return records;
  }
}
