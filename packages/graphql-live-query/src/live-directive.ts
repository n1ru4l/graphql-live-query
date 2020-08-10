import { GraphQLDirective, DirectiveLocation } from "graphql";

export const GraphQLLiveDirective = new GraphQLDirective({
  name: "live",
  description:
    "Instruction for establishing a live connection that is updated once the underlying data changes.",
  locations: [DirectiveLocation.QUERY],
});
