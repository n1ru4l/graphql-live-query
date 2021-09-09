---
"@n1ru4l/in-memory-live-query-store": minor
---

Add support for the `@live(throttle:)` directive argument for negotiating a throttle between the server and the client. This is useful for preventing the server to spam the client for data that might be updating too frequently.

The `InMemoryLiveQueryStore` now accepts a `validateThrottleValue` option that can be used to validate the incoming throttle value sent from clients.

```ts
const store = new InMemoryLiveQueryStore({
  validateThrottleValue: (value /* value as sent by client */) => {
    // value can either be null/undefined or a number
    // returning a string from this function will treat the provided value as invalid
    // and send an error back to the client.
    if (value == null || value > 1000) {
      return "Must provide throttle value in the range from 0-1000";
    }
    // returning a number will replace the user sent throttle value
    if (value === 420) {
      return 690;
    }
    // returning null or undefined will result in no throttle being used.
    return null;
  },
});
```
