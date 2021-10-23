---
"@n1ru4l/json-patch-plus": patch
---

Remove keys from the object instead of setting them to undefined.

```ts
const result = patch({
  left: { a: { a: 2 } },
  delta: { a: [null, 0, 0] },
});
// Previously result was
// { a: undefined }
// Now it is
// {}
```
