import * as React from "react";
import { Box, Text } from "@chakra-ui/core";
import graphql from "babel-plugin-relay/macro";
import { QueryRenderer, createFragmentContainer } from "react-relay";
import { Environment as RelayEnvironment } from "relay-runtime";
import type { ChatApplication_MessagesQuery } from "./__generated__/ChatApplication_MessagesQuery.graphql";
import { ChatApplication_ChatMessageFragment } from "./__generated__/ChatApplication_ChatMessageFragment.graphql";

const ChatApplicationMessagesQuery = graphql`
  query ChatApplication_MessagesQuery @live {
    messages(limit: 10) {
      id
      ...ChatApplication_ChatMessageFragment
    }
  }
`;

const ChatApplicationMessageFragment = graphql`
  fragment ChatApplication_ChatMessageFragment on Message {
    id
    content
    author {
      id
      name
    }
  }
`;

const ChatApplicationMessage = createFragmentContainer(
  ({ message }: { message: ChatApplication_ChatMessageFragment }) => {
    return (
      <Box key={message.id} d="flex">
        <Box padding="3" fontWeight="bold">
          {message.author.name}
        </Box>
        <Box padding="3">{message?.content}</Box>
      </Box>
    );
  },
  {
    message: ChatApplicationMessageFragment,
  }
);

export const ChatApplication: React.FunctionComponent<{
  relayEnvironment: RelayEnvironment;
}> = (props) => {
  return (
    <Box minHeight="100%" height="100%">
      <Box bg="gray.100" d="flex" height="75px" alignItems="center">
        <Box bg="purple.500" width="10px" height="100%" marginRight="3"></Box>
        <Text fontSize="3xl">GraphQL Live Chat</Text>
      </Box>
      <Box d="flex" height="calc(100vh - 75px)">
        <Box flex="3">
          <QueryRenderer<ChatApplication_MessagesQuery>
            environment={props.relayEnvironment}
            query={ChatApplicationMessagesQuery}
            variables={{}}
            render={({ props }) => {
              if (!props) return null;

              return props.messages.map((message) => (
                <ChatApplicationMessage key={message.id} message={message} />
              ));
            }}
          />
        </Box>
        <Box width="300px" bg="gray.100"></Box>
      </Box>
    </Box>
  );
};
