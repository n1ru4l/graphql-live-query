import {
  GraphQLOutputType,
  GraphQLScalarType,
  isNonNullType,
  isScalarType,
} from "graphql";

export const isNonNullIDScalarType = (
  type: GraphQLOutputType
): type is GraphQLScalarType => {
  if (isNonNullType(type)) {
    return isScalarType(type.ofType) && type.ofType.name === "ID";
  }
  return false;
};
