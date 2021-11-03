export const isAsyncIterable = <T>(
  value: T | AsyncIterable<T>
): value is AsyncIterable<T> => {
  return (
    typeof value === "object" && value !== null && Symbol.asyncIterator in value
  );
};
