import { GraphQLID, GraphQLNonNull, GraphQLString } from "graphql";
import { isNonNullIDScalarType } from "./isNonNullIDScalarType";

it("returns true for a NonNull ID scalar type", () => {
  const input = GraphQLNonNull(GraphQLID);
  expect(isNonNullIDScalarType(input)).toEqual(true);
});

it("returns false for a nullable ID scalar type", () => {
  const input = GraphQLID;
  expect(isNonNullIDScalarType(input)).toEqual(false);
});

it("returns false for any other random NonNull scalar type", () => {
  const input = GraphQLNonNull(GraphQLString);
  expect(isNonNullIDScalarType(input)).toEqual(false);
});
