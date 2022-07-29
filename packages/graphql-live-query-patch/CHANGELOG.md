# @n1ru4l/graphql-live-query-patch

## 0.7.0

### Minor Changes

- f585fb3: Support TypeScript ESM module resolution. More information on https://devblogs.microsoft.com/typescript/announcing-typescript-4-7/#ecmascript-module-support-in-node-js

### Patch Changes

- 25ad6d0: Ensure the `data` property reference changes for each published value in order to please GraphQL clients that rely on immutability.

## 0.6.1

### Patch Changes

- 727e806: fix memory leak cause by AsyncIterables not being disposed properly.

## 0.6.0

### Minor Changes

- f555f2f: GraphQL v16 compatibility

## 0.5.1

### Patch Changes

- 31ef74b: fix esm support for create-react-app and webpack

## 0.5.0

### Minor Changes

- 8e14fd2: improve ESM support by using export fields and .mjs file extensions

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
