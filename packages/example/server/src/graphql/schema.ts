import * as gql from "graphql";
import { GraphQLLiveDirective } from "@n1ru4l/graphql-live-queries";

const GraphQLNodeInterface = new gql.GraphQLInterfaceType({
  name: "Node",
  fields: {
    id: {
      type: gql.GraphQLNonNull(gql.GraphQLID),
    },
  },
});

const GraphQLUserType = new gql.GraphQLObjectType({
  name: "User",
  interfaces: [GraphQLNodeInterface],
  fields: {
    id: {
      type: gql.GraphQLNonNull(gql.GraphQLID),
      resolve: (record) => record.id,
    },
    name: {
      type: gql.GraphQLNonNull(gql.GraphQLString),
      resolve: (record) => record.name,
    },
  },
});

const GraphQLMessageType = new gql.GraphQLObjectType({
  name: "Message",
  interfaces: [GraphQLNodeInterface],
  fields: {
    id: {
      type: gql.GraphQLNonNull(gql.GraphQLID),
      resolve: (record) => record.id,
    },
    author: {
      type: gql.GraphQLNonNull(GraphQLUserType),
      resolve: (record, args, context) =>
        context.userStore.getById(record.authorId),
    },
    content: {
      type: gql.GraphQLNonNull(gql.GraphQLString),
      resolve: (record) => record.content,
    },
  },
});

const GraphQLNonNullList = (input: gql.GraphQLObjectType) =>
  gql.GraphQLNonNull(gql.GraphQLList(gql.GraphQLNonNull(input)));

const GraphQLCreateMessageInputType = new gql.GraphQLInputObjectType({
  name: "CreateMessageInput",
  fields: {
    content: { type: gql.GraphQLString },
  },
});

const GraphQLPageInfoType = new gql.GraphQLObjectType({
  name: "PageInfo",
  fields: {
    hasNextPage: {
      type: gql.GraphQLBoolean,
    },
    hasPreviousPage: {
      type: gql.GraphQLBoolean,
    },
    endCursor: {
      type: gql.GraphQLString,
    },
    startCursor: {
      type: gql.GraphQLString,
    },
  },
});

const GraphQLMessageEdgeType = new gql.GraphQLObjectType({
  name: "MessageEdge",
  fields: {
    node: { type: GraphQLMessageType },
    cursor: { type: gql.GraphQLString },
  },
});

const GraphQLMessageConnectionType = new gql.GraphQLObjectType({
  name: "MessageConnection",
  fields: {
    edges: {
      type: GraphQLNonNullList(GraphQLMessageEdgeType),
    },
    pageInfo: {
      type: GraphQLPageInfoType,
    },
  },
});

export const schema = new gql.GraphQLSchema({
  query: new gql.GraphQLObjectType({
    name: "RootQueryType",
    fields: {
      users: {
        type: GraphQLNonNullList(GraphQLUserType),
        args: {
          limit: {
            type: gql.GraphQLInt,
          },
        },
        resolve: (obj, args, context) => {
          const users = context.userStore.getAll();
          if (args.limit) {
            return users.slice(-args.limit);
          }
          return users;
        },
      },
      messages: {
        type: GraphQLMessageConnectionType,
        args: {
          first: {
            type: gql.GraphQLInt,
          },
        },
        resolve: (obj, args, context) => {
          const messages = context.messageStore.getAll();
          // if (args.limit) {
          //   return messages.slice(-args.limit);
          // }
          return {
            edges: messages.map((message: any) => ({
              cursor: message.id,
              node: message,
            })),
            pageInfo: { hasNextPage: false },
          };
        },
      },
      node: {
        type: GraphQLNodeInterface,
        args: {
          id: {
            type: gql.GraphQLNonNull(gql.GraphQLID),
          },
        },
        resolve: (obj, args, context) => {
          return null;
        },
      },
    },
  }),
  mutation: new gql.GraphQLObjectType({
    name: "RootMutationType",
    fields: {
      createMessage: {
        type: gql.GraphQLBoolean,
        args: {
          input: {
            type: GraphQLCreateMessageInputType,
          },
        },
      },
    },
  }),
  subscription: new gql.GraphQLObjectType({
    name: "RootSubscriptionType",
    fields: {
      onNewMessage: {
        type: gql.GraphQLBoolean,
        resolve: (obj) => {
          return obj;
        },
        subscribe: (obj, args, context) =>
          context.subscriptionPubSub.asyncIterator("onNewMessage"),
      },
    },
  }),
  directives: [GraphQLLiveDirective],
});
