# `@n1ru4l/json-patch-plus`

This is a slimmed version of [jsondiffpatch](https://github.com/benjamine/jsondiffpatch). All the code is taken from the [jsondiffpatch](https://github.com/benjamine/jsondiffpatch) repository, slimmed down, slightly altered and converted to TypeScript.

Huge thanks to [@benjamine](https://github.com/benjamine), who did all the heavy work!

`jsondiffpatch` is a replacement for [`json-patch`](https://datatracker.ietf.org/doc/html/rfc6902) that produces more efficient patches!

`@n1ru4l/json-patch-plus` has the following changes:

- Full ESM support
- Remove Node.js runtime dependencies introduced through loggers
- Remove class wrapper structures (make code less abstract and smaller)
- Remove text diffing
- Only generate and apply patch deltas (no reversing and visualization)
- Exclude unnecessary data from patch deltas (previous value is replaced with `null`)

For a full description of the delta format please refer to the [`jsondiffpatch` docs](https://github.com/benjamine/jsondiffpatch/tree/master/docs)

## Install Instructions

```bash
yarn install -E @n1ru4l/json-patch-plus
```

## Usage

```tsx
import { diff, patch } from "@n1ru4l/json-patch-plus";

const delta = diff({
  left: {},
  right: { a: { b: 1 } },
});

const result = patch({
  left: {},
  delta,
});

console.log(result);
// logs '{ a: { b: 1 } }'
```
