import type { ExecutionResult } from "graphql";
import { isSome } from "./isSome";

type GraphQLExecutionResultData =
  | {
      [key: string]: unknown;
    }
  | null
  | undefined;

type ObjectMap = Map<string, GraphQLExecutionResultData>;

export type DeflateIdentifierBuilder = (input: unknown) => string | null;

export const defaultDeflateNormalizationIdentifierBuilder: DeflateIdentifierBuilder = (
  input
) =>
  (typeof input === "object" &&
    input !== null &&
    typeof input["id"] === "string" &&
    input["id"]) ??
  null;

export type DeflateBuildKeyIdentifier = (input: string) => string;

export const defaultDeflateBuildKeyIdentifier: DeflateBuildKeyIdentifier = (
  id
) => `$$ref:${id}`;

const deflateGraphQLExecutionResultDataLeaf = (
  value: unknown,
  getId: DeflateIdentifierBuilder,
  buildKeyIdentifier: DeflateBuildKeyIdentifier,
  objects: ObjectMap
): string | unknown => {
  if (Array.isArray(value)) {
    return value.map((value) =>
      deflateGraphQLExecutionResultDataLeaf(
        value,
        getId,
        buildKeyIdentifier,
        objects
      )
    );
  } else if (typeof value === "object" && isSome(value)) {
    const id = getId(value);
    if (id) {
      let record = objects.get(id);
      if (!record) {
        record = {};
        objects.set(id, record);
      }

      for (const [key, keyValue] of Object.entries(value)) {
        record[key] = deflateGraphQLExecutionResultDataLeaf(
          keyValue,
          getId,
          buildKeyIdentifier,
          objects
        );
      }

      return buildKeyIdentifier(id);
    }

    let record = {};
    for (const [key, keyValue] of Object.entries(value)) {
      record[key] = deflateGraphQLExecutionResultDataLeaf(
        keyValue,
        getId,
        buildKeyIdentifier,
        objects
      );
    }
    return record;
  }

  return value;
};

const deflateGraphQLExecutionResultData = (
  executionResult: GraphQLExecutionResultData,
  getId: DeflateIdentifierBuilder,
  buildKeyIdentifier: DeflateBuildKeyIdentifier,
  objects: ObjectMap
) => {
  let root: any = executionResult;
  if (isSome(executionResult)) {
    root = {};
    for (const [key, value] of Object.entries(executionResult)) {
      root[key] = deflateGraphQLExecutionResultDataLeaf(
        value,
        getId,
        buildKeyIdentifier,
        objects
      );
    }
  }
  objects.set("[ROOT]", root);
};

const mapToObject = (map: ObjectMap): GraphQLExecutionResultData => {
  const obj = {};
  for (let [k, v] of map) {
    v instanceof Map ? (obj[k] = mapToObject(v)) : (obj[k] = v);
  }

  return obj;
};

export const deflateGraphQLExecutionResult = (
  executionResult: ExecutionResult,
  normalizationIdentifierBuilder: DeflateIdentifierBuilder = defaultDeflateNormalizationIdentifierBuilder,
  buildKeyIdentifier: DeflateBuildKeyIdentifier = defaultDeflateBuildKeyIdentifier
) => {
  const normalizedTreeMap: ObjectMap = new Map();

  deflateGraphQLExecutionResultData(
    executionResult.data,
    normalizationIdentifierBuilder,
    buildKeyIdentifier,
    normalizedTreeMap
  );

  let result = {
    data: mapToObject(normalizedTreeMap),
  };

  if (executionResult.errors) {
    result["errors"] = executionResult.errors;
  }
  if (executionResult.extensions) {
    result["extensions"] = executionResult.extensions;
  }

  return result as ExecutionResult<unknown>;
};
