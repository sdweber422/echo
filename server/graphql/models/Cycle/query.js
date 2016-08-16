import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLList} from 'graphql/type'
import {GraphQLError} from 'graphql/error'

import r from 'src/db/connect'
import {getCycleById} from 'src/server/db/cycle'
import {handleError} from 'src/server/graphql/models/util'

import {Cycle} from './schema'

export default {
  getCycleById: {
    type: Cycle,
    args: {
      id: {type: new GraphQLNonNull(GraphQLID)}
    },
    async resolve(source, args, {rootValue: {currentUser}}) {
      try {
        if (!currentUser) {
          throw new GraphQLError('You are not authorized to do that.')
        }

        const result = await getCycleById(args.id, {mergeChapter: true})

        return result
      } catch (err) {
        handleError(err)
      }
    },
  },
  getAllCycles: {
    type: new GraphQLList(Cycle),
    async resolve(source, args, {rootValue: {currentUser}}) {
      try {
        if (!currentUser) {
          throw new GraphQLError('You are not authorized to do that.')
        }

        const result = await r.table('cycles')
          .eqJoin('chapterId', r.table('chapters'))
          .without({left: 'chapterId'}, {right: 'inviteCodes'})
          .map(doc => doc('left').merge({chapter: doc('right')}))
          .run()

        return result
      } catch (err) {
        handleError(err)
      }
    },
  },
}
