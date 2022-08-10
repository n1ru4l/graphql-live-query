import type { GraphQLError } from "@graphql-tools/graphql";

/**
 * The result of an asynchronous GraphQL patch.
 *
 *   - `errors` is included when any errors occurred as a non-empty array.
 *   - `data` is the result of the additional asynchronous data.
 *   - `path` is the location of data.
 *   - `hasNext` is true if a future payload is expected.
 *   - `label` is the label provided to @defer or @stream.
 *   - `extensions` is reserved for adding non-standard properties.
 *  @source Copied from the original GraphQL type-definitions.
 */
export interface ExecutionPatchResult<
  TData = { [key: string]: any },
  TExtensions = { [key: string]: any }
> {
  errors?: ReadonlyArray<GraphQLError>;
  data?: TData | null;
  path?: ReadonlyArray<string | number>;
  label?: string;
  hasNext: boolean;
  extensions?: TExtensions;
}
