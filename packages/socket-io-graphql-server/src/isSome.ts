export const isSome = <T>(input: T): input is Exclude<T, null | undefined> =>
  input != null;
