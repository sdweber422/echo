import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLList} from 'graphql/type'
import {GraphQLError} from 'graphql/error'

import r from 'src/db/connect'
import {getPlayerById} from 'src/server/db/player'
import {getModeratorById} from 'src/server/db/moderator'
import {handleError} from 'src/server/graphql/models/util'

import {User} from './schema'

export default {
  getPlayerById: {
    type: User,
    args: {
      id: {type: new GraphQLNonNull(GraphQLID)}
    },
    async resolve(source, args, {rootValue: {currentUser}}) {
      if (!currentUser) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      const result = await getPlayerById(args.id, {mergeChapter: true})
        .catch(handleError)

      if (result) {
        return result
      }
      throw new GraphQLError('No such player')
    },
  },
  getAllPlayers: {
    type: new GraphQLList(User),
    async resolve(source, args, {rootValue: {currentUser}}) {
      if (!currentUser) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      const result = await r.table('players')
        .eqJoin('chapterId', r.table('chapters'))
        .without({left: 'chapterId'}, {right: 'inviteCodes'})
        .map(doc => doc('left').merge({chapter: doc('right')}))
        .run()
        .catch(handleError)

      return result
    },
  },
  getUserById: {
    type: User,
    args: {
      id: {type: new GraphQLNonNull(GraphQLID)},
    },
    async resolve(source, {id}, {rootValue: {currentUser}}) {
      if (!currentUser) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      const result = await r.branch(
        r.table('players').getAll(id).count().eq(1),
        getPlayerById(id, {mergeChapter: true}),
        r.table('moderators').getAll(id).count().eq(1),
        getModeratorById(id, {mergeChapter: true}),
        null
      )

      if (result) {
        return result
      }
      throw new GraphQLError('No such user')
    }
  },
}
