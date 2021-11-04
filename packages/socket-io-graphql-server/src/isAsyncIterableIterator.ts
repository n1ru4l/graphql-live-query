export const isAsyncIterableIterator = <T>(
  value: T | AsyncIterableIterator<T>
): value is AsyncIterableIterator<T> => {
  return (
    typeof value === "object" && value !== null && Symbol.asyncIterator in value
  );
};
