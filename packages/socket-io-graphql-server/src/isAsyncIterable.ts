export const isAsyncIterable = <T>(
  value: unknown | AsyncIterable<T>
): value is AsyncIterable<T> => {
  if (typeof value === "object" && value !== null) {
    const isIterable = Symbol.iterator in value;
    const isAsync = Symbol.asyncIterator in value;
    return isAsync || isIterable;
  }

  return false;
};
