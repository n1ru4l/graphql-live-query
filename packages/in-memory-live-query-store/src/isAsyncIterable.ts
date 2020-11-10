export const isAsyncIterable = (
  value: unknown
): value is AsyncIterable<unknown> => {
  return (
    typeof value === "object" && value !== null && Symbol.asyncIterator in value
  );
};
