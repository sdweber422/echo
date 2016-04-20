import raven from 'raven'

import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLList} from 'graphql/type'
import {GraphQLError} from 'graphql/error'

import {Player} from './schema'

import {userCan} from '../../../../common/util'
import r from '../../../../db/connect'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export default {
  reassignPlayersToChapter: {
    type: new GraphQLList(Player),
    args: {
      playerIds: {type: new GraphQLList(GraphQLID)},
      chapterId: {type: new GraphQLNonNull(GraphQLID)},
    },
    async resolve(source, {playerIds, chapterId}, {rootValue: {currentUser}}) {
      if (!userCan(currentUser, 'reassignPlayersToChapter')) {
        throw new GraphQLError('You are not authorized to do that.')
      }
      try {
        const now = r.now()
        const chapter = await r.table('chapters').get(chapterId).run()
        if (!chapter) {
          throw new GraphQLError('No such chapter.')
        }

        const chapterHistoryItem = {
          chapterId,
          until: now,
        }
        // find all of the players for the given IDs, but only update the ones
        // who aren't already in the given chapter
        const updatedPlayers = await r.table('players')
          .getAll(...playerIds)
          .filter(r.row('chapterId').ne(chapterId))
          .update({
            chapterId,
            chapterHistory: r.row('chapterHistory').default([]).insertAt(0, chapterHistoryItem),
            updatedAt: now,
          }, {returnChanges: 'always'})
          .run()

        if (updatedPlayers.errors) {
          throw new GraphQLError(updatedPlayers.first_error)
        }
        if (updatedPlayers.replaced > 0) {
          return updatedPlayers.changes.map(change => Object.assign({}, change.new_val, {chapter}))
        }
        return []
      } catch (err) {
        sentry.captureException(err)
        throw err
      }
    }
  },
}
