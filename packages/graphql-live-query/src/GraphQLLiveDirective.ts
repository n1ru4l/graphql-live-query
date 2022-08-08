import {
  GraphQLDirective,
  DirectiveLocation,
  GraphQLBoolean,
  GraphQLInt,
} from "@graphql-tools/graphql";

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
      description:
        'Propose a desired throttle interval ot the server in order to receive updates to at most once per "throttle" milliseconds. The server must not accept this value.',
    },
  },
});
