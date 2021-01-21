export type None = null | undefined;
export const isSome = <T>(input: T): input is Exclude<T, None> => input != null;
export const isNone = (input: unknown): input is None => input == null;
export type Maybe<T> = T | None;
