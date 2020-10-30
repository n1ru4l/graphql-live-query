import { isSome } from "./Maybe";

export const isPromise = (input: unknown): input is Promise<unknown> => {
  return (
    isSome(input) && "then" in input && typeof input["then"] === "function"
  );
};
