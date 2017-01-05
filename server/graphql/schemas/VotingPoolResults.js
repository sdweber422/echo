import {GraphQLString, GraphQLInt, GraphQLNonNull, GraphQLID, GraphQLBoolean} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'

export default new GraphQLObjectType({
  name: 'VotingPoolResults',
  description: 'Results on goal voting for a pool',
  fields: () => {
    const {CandidateGoal, User} = require('src/server/graphql/schemas')

    return {
      id: {type: new GraphQLNonNull(GraphQLID), description: 'The pool id'},
      name: {type: new GraphQLNonNull(GraphQLString), description: 'The pool name'},
      level: {type: GraphQLInt, desription: 'The pool level'},
      candidateGoals: {type: new GraphQLList(CandidateGoal), description: 'The candidate goals for the given pool'},
      users: {type: new GraphQLList(User), description: 'A list of all players in this pool'},
      voterPlayerIds: {type: new GraphQLList(GraphQLID), description: 'The playerId os all players who have voted in this pool'},
      votingIsStillOpen: {type: GraphQLBoolean, description: 'True is votes are still being accepted for this pool'},
    }
  },
})
