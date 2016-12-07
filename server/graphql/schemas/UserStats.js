import {GraphQLInt, GraphQLFloat} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'

import {STAT_DESCRIPTORS} from 'src/common/models/stat'

export default new GraphQLObjectType({
  name: 'UserStats',
  description: 'A user\'s overall stats',
  fields: () => {
    return {
      [STAT_DESCRIPTORS.EXPERIENCE_POINTS]: {type: GraphQLFloat, description: 'Experience points'},
      [STAT_DESCRIPTORS.RATING_ELO]: {type: GraphQLInt, description: 'Elo rating'},
    }
  }
})
