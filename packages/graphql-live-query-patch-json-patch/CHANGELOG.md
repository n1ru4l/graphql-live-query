# @n1ru4l/graphql-live-query-patch-json-patch

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
