export type None = null | undefined;
export const isSome = <T>(input: T): input is Extract<T, None> => input != null;
export type Maybe<T> = T | None;
