import {graphql, GraphQLString, GraphQLSchema, GraphQLObjectType} from 'graphql'

const noopQuery = new GraphQLObjectType({name: 'Query', fields: () => ({
  noop: {
    type: GraphQLString,
    resolve: () => null,
  }
})})

export function runGraphQLQuery(graphqlQueryString, fields, args = undefined, rootQuery = {currentUser: true}) {
  const query = new GraphQLObjectType({name: 'Query', fields})
  const schema = new GraphQLSchema({query})

  return graphql(schema, graphqlQueryString, rootQuery, args)
}

export function runGraphQLMutation(graphqlQueryString, fields, args = undefined, rootQuery = {currentUser: true}) {
  const mutation = new GraphQLObjectType({name: 'Mutation', fields})
  const schema = new GraphQLSchema({
    query: noopQuery, // GraphQL really wants you to have a query, even if it's not used
    mutation
  })

  return graphql(schema, graphqlQueryString, rootQuery, args)
}

