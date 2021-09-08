# @n1ru4l/graphql-live-query-patch

## 0.4.0

### Minor Changes

- a002527: omit empty patches from being sent to clients

## 0.3.2

### Patch Changes

- 04a7fb6: BREAKING move `@n1ru4l/graphql-live-query-patch` logic to `@n1ru4l/graphql-live-query-patch-json-patch`. `@n1ru4l/graphql-live-query-patch` now contains generic logic for patch generation. `@n1ru4l/graphql-live-query-patch-jsondiffpatch` implements the more efficient jsondiffpatch algorithm

## 0.3.1

### Patch Changes

- 0caaad0: Ensure compat for non experimental graphql releases without defer and stream support.

## 0.3.0

### Minor Changes

- 258640e: Namings are hard...

  `createLiveQueryPatchDeflator` -> `createLiveQueryPatchGenerator`
  `applyLiveQueryPatchDeflator` -> `createApplyLiveQueryPatchGenerator`
  `applyLiveQueryPatchInflator` -> `createApplyLiveQueryPatch`

  Create immutable patches be default.

## 0.2.0

### Minor Changes

- 2a5c28a: rename `createLiveQueryPatchInflator` to `applyLiveQueryPatchInflator`

## 0.1.0

### Minor Changes

- 3ad59d1: Initial release for @n1ru4l/graphql-live-query-patch
