export const isSome = <T>(input: T): input is Extract<T, null | undefined> =>
  input != null;
