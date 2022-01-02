import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
} from '@apollo/client/core';
import { DefaultApolloClient } from '@vue/apollo-composable';
import { boot } from 'quasar/wrappers';

export default boot(({ app }) => {
  const graphqlURL = new URL(origin)
  graphqlURL.pathname = 'graphql'

  // HTTP connection to the API
  const httpLink = createHttpLink({
    // You should use an absolute URL here
    uri: graphqlURL.toString(),
  });

  // Cache implementation
  const cache = new InMemoryCache();

  // Create the apollo client
  const apolloClient = new ApolloClient({
    link: httpLink,
    cache,
  });
  console.log('Provide appolo client!!!')
  app.provide(DefaultApolloClient, apolloClient);
});
