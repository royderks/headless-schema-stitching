import { GraphQLList } from 'graphql'
import { ApolloServer } from 'apollo-server-micro';
import {
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageDisabled,
} from 'apollo-server-core';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { stitchSchemas } from '@graphql-tools/stitch';
import { delegateToSchema } from '@graphql-tools/delegate';
import { RenameTypes, RenameRootFields } from '@graphql-tools/wrap';

import createRemoteSchema from '../../utils/createRemoteSchema';

// Configuration for Next.js API Routes
export const config = {
  api: {
    bodyParser: false,
  },
};

// Our local schema with cart information
let cart = [];

let localSchema = makeExecutableSchema({
  typeDefs: `
  type Query {
    cart: [Product]!
  }
  type Product {
    id: ID!
    name: String!
  }
  `,
  resolvers: {
    Query: {
      cart() {
        return cart;
      },
    },
  },
});

// Export as a Next.js API Route
export default async function grapqhl(req, res) {
  // Setup subschema configurations
  const localSubschema = { schema: localSchema };

  const cmsSubschema = await createRemoteSchema({
    url: 'http://localhost:3001/graphql/',
    transforms: [
      new RenameRootFields(
        (operationName, fieldName, fieldConfig) => `cms_${fieldName}`,
      ),
      new RenameTypes((name) => `Cms_${name}`),
    ],
  });

  const productsSubschema = await createRemoteSchema({
    url: 'http://localhost:3002/graphql/',
  });

  // Build the combined schema and set up the extended schema and resolver
  const schema = stitchSchemas({
    subschemas: [localSubschema, productsSubschema, cmsSubschema],
    typeDefs: `
      extend type Product {
        cmsMetaData: [Cms_Product]!
      }
    `,
    resolvers: {
      Product: {
        cmsMetaData: {
          selectionSet: `{ id }`,
          resolve(product, args, context, info) {
            // Get the data for the extended type from the subschema for the CMS
            return delegateToSchema({
              schema: cmsSubschema,
              operation: 'query',
              fieldName: 'cms_allProducts',
              args: { filter: { id: product.id } },
              context,
              info,
            });
          },
        },
      },
    },
  });

  // Set up the GraphQL server
  const apolloServer = new ApolloServer({
    schema,
    // Use the "old" GraphQL Playground
    plugins: [
      process.env.NODE_ENV === 'production'
        ? ApolloServerPluginLandingPageDisabled()
        : ApolloServerPluginLandingPageGraphQLPlayground(),
    ],
  });

  await apolloServer.start();

  const apolloServerHandler = apolloServer.createHandler({
    path: '/api/graphql',
  });

  // Return the GraphQL endpoint
  return apolloServerHandler(req, res);
}
