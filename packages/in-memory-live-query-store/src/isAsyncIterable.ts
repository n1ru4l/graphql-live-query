export const isAsyncIterable = <T>(
  value: unknown | AsyncIterable<T>
): value is AsyncIterable<T> => {
  if (typeof value === "object" && value !== null) {
    const isAsync = Symbol.asyncIterator in value;
    return isAsync;
  }

  return false;
};
