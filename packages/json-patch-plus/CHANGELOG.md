# @n1ru4l/json-patch-plus

## 0.1.4

### Patch Changes

- 31ef74b: fix esm support for create-react-app and webpack

## 0.1.3

### Patch Changes

- 108970b: Remove keys from the object instead of setting them to undefined.

  ```ts
  const result = patch({
    left: { a: { a: 2 } },
    delta: { a: [null, 0, 0] }
  });
  // Previously result was
  // { a: undefined }
  // Now it is
  // {}
  ```

## 0.1.2

### Patch Changes

- c9e7941: correctly handle null values with diff

## 0.1.1

### Patch Changes

- 6f86843: ensure unmodified properties are not removed when applying patches

## 0.1.0

### Minor Changes

- 7e56721: Initial release
