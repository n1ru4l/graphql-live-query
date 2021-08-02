import { GraphQLDirective, DirectiveLocation, GraphQLBoolean, GraphQLInt } from "graphql";

export const GraphQLLiveDirective = new GraphQLDirective({
  name: "live",
  description:
    "Instruction for establishing a live connection that is updated once the underlying data changes.",
  locations: [DirectiveLocation.QUERY],
  args: {
    if: {
      type: GraphQLBoolean,
      defaultValue: true,
      description: "Whether the query should be live or not.",
    },
    throttle: {
      type: GraphQLInt,
      description: "Limit updates to at most once per \"throttle\" milliseconds."
    }
  },
});
