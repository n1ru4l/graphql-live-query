# @n1ru4l/graphql-live-query-patch-json-patch

## 0.7.0

### Minor Changes

- f585fb3: Support TypeScript ESM module resolution. More information on https://devblogs.microsoft.com/typescript/announcing-typescript-4-7/#ecmascript-module-support-in-node-js

### Patch Changes

- Updated dependencies [25ad6d0]
- Updated dependencies [f585fb3]
  - @n1ru4l/graphql-live-query-patch@0.7.0

## 0.6.1

### Patch Changes

- 727e806: unpin `fast-json-patch` dependency.
- Updated dependencies [727e806]
  - @n1ru4l/graphql-live-query-patch@0.6.1

## 0.6.0

### Minor Changes

- f555f2f: GraphQL v16 compatibility

### Patch Changes

- Updated dependencies [f555f2f]
  - @n1ru4l/graphql-live-query-patch@0.6.0

## 0.5.2

### Patch Changes

- 31ef74b: fix esm support for create-react-app and webpack
- Updated dependencies [31ef74b]
  - @n1ru4l/graphql-live-query-patch@0.5.1

## 0.5.1

### Patch Changes

- 30d2720: fix esm support

## 0.5.0

### Minor Changes

- 8e14fd2: improve ESM support by using export fields and .mjs file extensions

### Patch Changes

- Updated dependencies [8e14fd2]
  - @n1ru4l/graphql-live-query-patch@0.5.0

## 0.4.0

### Minor Changes

- a002527: omit empty patches from being sent to clients

### Patch Changes

- Updated dependencies [a002527]
  - @n1ru4l/graphql-live-query-patch@0.4.0

## 0.3.3

### Patch Changes

- 791ed67: add missing dependency on `@n1ru4l/graphql-live-query-patch`

## 0.3.2

### Patch Changes

- 04a7fb6: BREAKING move `@n1ru4l/graphql-live-query-patch` logic to `@n1ru4l/graphql-live-query-patch-json-patch`. `@n1ru4l/graphql-live-query-patch` now contains generic logic for patch generation. `@n1ru4l/graphql-live-query-patch-jsondiffpatch` implements the more efficient jsondiffpatch algorithm
