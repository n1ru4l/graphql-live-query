import { isNone } from "./Maybe";

/**
 * ResourceTracker is a ad hoc system for tracking events associated with a record.
 * In case the set of events change, the list can be updated by calling the `track`
 * method again with the previous and new event identifiers.
 * A set of all records that subscribe to a sepecific event can be retrieved with
 * the `getRecordsForIdentifiers` method.
 */
export class ResourceTracker<TRecord> {
  private _trackedResources: Map<string, Set<TRecord>>;
  constructor() {
    this._trackedResources = new Map();
  }

  /**
   * Update the set of identifiers a resource is subscribed to.
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
   * Register a record and subscribe to the provided set of identifiers.
   *
   * @param record The record that should be tracked
   * @param identifiers The list of identifiers
   */
  register(record: TRecord, identifiers: Set<string>): void {
    this.track(record, new Set(), identifiers);
  }

  /**
   * Release a record that subscribes to a specific set of identifiers.
   */
  release(record: TRecord, identifiers: Set<string>): void {
    this.track(record, identifiers, new Set());
  }

  /**
   * Get all records that subscribes to a specific set of identifiers with a set identifiers that are hits for each record.
   */
  getRecordsForIdentifiers(
    identifiers: Array<string>
  ): Map<TRecord, Set<string>> {
    const recordWithHits = new Map<TRecord, Set<string>>();
    for (const identifier of identifiers) {
      const recordSet = this._trackedResources.get(identifier);
      if (isNone(recordSet)) {
        continue;
      }

      for (const record of recordSet) {
        let identifierHits = recordWithHits.get(record);
        if (isNone(identifierHits)) {
          identifierHits = new Set();
          recordWithHits.set(record, identifierHits);
        }
        identifierHits.add(identifier);
      }
    }

    return recordWithHits;
  }
}
