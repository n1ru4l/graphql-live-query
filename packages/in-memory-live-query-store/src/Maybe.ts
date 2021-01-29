export type None = null | undefined;
export const isSome = <T>(input: T): input is Exclude<T, None> => input != null;
export const isNone = <T>(input: T | None): input is None => input == null;
export type Maybe<T> = T | None;
