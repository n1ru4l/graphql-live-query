export const isPromise = (input: unknown): input is Promise<unknown> => {
  return (
    typeof input === "object" &&
    "then" in input &&
    typeof input["then"] === "function"
  );
};
