import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
  split,
} from '@apollo/client/core';
import { getMainDefinition } from '@apollo/client/utilities';
import { WebSocketLink } from '@apollo/client/link/ws';
import { DefaultApolloClient } from '@vue/apollo-composable';
import { boot } from 'quasar/wrappers';

export default boot(({ app }) => {
  const graphqlURL = new URL(origin);
  graphqlURL.pathname = 'graphql';

  // HTTP connection to the API
  const httpLink = createHttpLink({
    // You should use an absolute URL here
    uri: graphqlURL.toString(),
  });

  // Create a WebSocket link:
  const wsURL = new URL(graphqlURL);
  wsURL.protocol = 'wss';

  const wsLink = new WebSocketLink({
    uri: wsURL.toString(),
    options: {
      reconnect: true,
    },
  });

  const link = split(
    // split based on operation type
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    wsLink,
    httpLink
  );

  // Cache implementation
  const cache = new InMemoryCache();

  // Create the apollo client
  const apolloClient = new ApolloClient({
    link,
    cache,
  });
  app.provide(DefaultApolloClient, apolloClient);
});
