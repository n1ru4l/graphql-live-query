import { ResourceTracker } from "./ResourceTracker.js";

it("can be created", () => {
  new ResourceTracker();
});

it("can track a resource", () => {
  const resourceTracker = new ResourceTracker<number>();
  const events = new Set(["a", "b"]);
  resourceTracker.track(1, new Set(), events);
  let result = resourceTracker.getRecordsForIdentifiers(["c"]);
  expect([...result]).toEqual([]);
  result = resourceTracker.getRecordsForIdentifiers(["a"]);
  expect([...result]).toEqual([1]);
});

it("can update the tracked resources", () => {
  const resourceTracker = new ResourceTracker<number>();
  const events = new Set(["a", "b"]);
  resourceTracker.track(1, new Set(), events);
  let result = resourceTracker.getRecordsForIdentifiers(["a"]);
  expect([...result]).toEqual([1]);
  resourceTracker.track(1, events, new Set(["c"]));
  result = resourceTracker.getRecordsForIdentifiers(["a"]);
  expect([...result]).toEqual([]);
  result = resourceTracker.getRecordsForIdentifiers(["c"]);
  expect([...result]).toEqual([1]);
});

it("can track multiple resources", () => {
  const resourceTracker = new ResourceTracker<number>();
  const events = new Set(["a", "b"]);
  resourceTracker.track(1, new Set(), events);
  resourceTracker.track(2, new Set(), events);
  let result = resourceTracker.getRecordsForIdentifiers(["a"]);
  expect([...result]).toEqual([1, 2]);
});

it("can release a tracked resource", () => {
  const resourceTracker = new ResourceTracker<number>();
  const events = new Set(["a", "b"]);
  resourceTracker.track(1, new Set(), events);
  resourceTracker.release(1, events);
  let result = resourceTracker.getRecordsForIdentifiers(["a"]);
  expect([...result]).toEqual([]);
});
