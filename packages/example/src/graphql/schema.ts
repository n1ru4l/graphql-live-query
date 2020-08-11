/*
`
  type User {
    id: ID!
    name: String!
  }
  
  type Message {
    id: ID!
    message: String!
    author: User!
  }
  
  type Query {
    users: [User!]!
    messages: [Message!]!
  }
  
  input CreateMessageInput {
    message: String!
  }
  
  type Mutation {
    createMessage(input: CreateMessageInput!): Boolean
  }
`
*/
import * as gql from "graphql";
import { GraphQLLiveDirective } from "@n1ru4l/graphql-live-queries";

const GraphQLUserType = new gql.GraphQLObjectType({
  name: "User",
  fields: {
    id: {
      type: gql.GraphQLID,
      resolve: (record) => record.id,
    },
    name: {
      type: gql.GraphQLString,
      resolve: (record) => record.name,
    },
  },
});

const GraphQLMessageType = new gql.GraphQLObjectType({
  name: "Message",
  fields: {
    id: {
      type: gql.GraphQLID,
      resolve: (record) => record.id,
    },
    author: {
      type: GraphQLUserType,
      resolve: (record, args, context) =>
        context.userStore.getById(record.authorId),
    },
    content: {
      type: gql.GraphQLString,
      resolve: (record) => record.content,
    },
  },
});

const GraphQLCreateMessageInputType = new gql.GraphQLInputObjectType({
  name: "CreateMessageInput",
  fields: {
    content: { type: gql.GraphQLString },
  },
});

const GraphQLNonNullList = (input: gql.GraphQLObjectType) =>
  gql.GraphQLNonNull(gql.GraphQLList(input));

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
        type: GraphQLNonNullList(GraphQLMessageType),
        args: {
          limit: {
            type: gql.GraphQLInt,
          },
        },
        resolve: (obj, args, context) => {
          const messages = context.messageStore.getAll();
          if (args.limit) {
            return messages.slice(-args.limit);
          }
          return messages;
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
  directives: [GraphQLLiveDirective],
});
