import type { ExecutionResult } from "graphql";

export type InflateParseIdentifier = (input: string) => string | null;

type InflateCache = Map<string, unknown>;

const defaultParseIdentifier: InflateParseIdentifier = (input) =>
  input.startsWith("$$ref:") ? input.replace("$$ref:", "") : null;

const deflateGraphQLExecutionResultLeaf = (
  value: unknown,
  inflateCache: InflateCache,
  parseIdentifier: InflateParseIdentifier,
  map: Map<string, unknown>
): unknown => {
  if (Array.isArray(value)) {
    return value.map((value) =>
      deflateGraphQLExecutionResultLeaf(
        value,
        inflateCache,
        parseIdentifier,
        map
      )
    );
  } else if (typeof value === "string") {
    const id = parseIdentifier(value);

    if (id !== null) {
      const object = map.get(id);

      if (typeof object === "object" && object !== null) {
        if (inflateCache.has(id)) {
          return {
            id: object["id"],
          };
        } else {
          const result = {};
          for (const [key, keyValue] of Object.entries(object)) {
            result[key] = deflateGraphQLExecutionResultLeaf(
              keyValue,
              inflateCache,
              parseIdentifier,
              map
            );
          }
          inflateCache.set(id, result);
          return result;
        }
      }
    }
  } else if (typeof value === "object" && value !== null) {
    let result = {};
    for (const [key, keyValue] of Object.entries(value)) {
      result[key] = deflateGraphQLExecutionResultLeaf(
        keyValue,
        inflateCache,
        parseIdentifier,
        map
      );
    }
    return result;
  }

  return value;
};

const inflateGraphQLExecutionResultData = (
  map: Map<string, unknown>,
  inflatedCache: InflateCache,
  parseIdentifier: InflateParseIdentifier
) => {
  const root = map.get("[ROOT]");
  let result = root;

  if (typeof root === "object" && root !== null) {
    result = {};
    for (const [key, value] of Object.entries(root)) {
      result[key] = deflateGraphQLExecutionResultLeaf(
        value,
        inflatedCache,
        parseIdentifier,
        map
      );
    }
  }

  return result;
};

export const inflateGraphQLExecutionResult = (
  executionResult: ExecutionResult,
  parseIdentifier: InflateParseIdentifier = defaultParseIdentifier
) => {
  let result = {};

  if (executionResult.errors) {
    result["errors"] = executionResult.errors;
  }
  if (executionResult.extensions) {
    result["extensions"] = executionResult.extensions;
  }

  if (
    typeof executionResult.data === "object" &&
    executionResult.data !== null
  ) {
    result["data"] = inflateGraphQLExecutionResultData(
      new Map(Object.entries(executionResult.data)),
      new Map(),
      parseIdentifier
    );
  }
  return result as ExecutionResult<unknown>;
};
