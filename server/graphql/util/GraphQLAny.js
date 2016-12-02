import {GraphQLScalarType} from 'graphql/type'

export default new GraphQLScalarType({
  name: 'Any',
  coerce: value => (value),
  coerceLiteral: ast => (ast.value),
  serialize: value => (value),
})
