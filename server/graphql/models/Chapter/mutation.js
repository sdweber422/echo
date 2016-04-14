import raven from 'raven'

import {GraphQLNonNull, GraphQLString, GraphQLID} from 'graphql'
import {GraphQLInputObjectType} from 'graphql/type'
import {GraphQLError} from 'graphql/error'

import {GraphQLDateTime} from 'graphql-custom-types'

import {Chapter} from './schema'

import r from '../../../../db/connect'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

const InputChapter = new GraphQLInputObjectType({
  name: 'InputChapter',
  description: 'The chapter',
  fields: () => ({
    id: {type: GraphQLID, description: 'The chapter UUID'},
    name: {type: new GraphQLNonNull(GraphQLString), description: 'The chapter name'},
    channelName: {type: new GraphQLNonNull(GraphQLString), description: 'The chapter chat channel name'},
    timezone: {type: GraphQLString, description: 'The chapter timezone'},
    cycleDuration: {type: new GraphQLNonNull(GraphQLString), description: 'The cycle duration'},
    cycleEpoch: {type: GraphQLDateTime, description: 'The start timestamp of the first cycle'},
  })
})

export default {
  createOrUpdateChapter: {
    type: Chapter,
    args: {
      chapter: {type: new GraphQLNonNull(InputChapter)},
    },
    async resolve(source, {chapter}, {rootValue: {currentUser}}) {
      const currentUserCanWrite = (
        currentUser &&
        currentUser.roles &&
        (currentUser.roles.indexOf('moderator') >= 0 || currentUser.roles.indexOf('backoffice') >= 0)
      )
      if (!currentUserCanWrite) {
        throw new GraphQLError('You are not authorized to do that.')
      }
      try {
        // TODO: add validation!
        const now = r.now()
        let chapterWithTimestamps = Object.assign(chapter, {updatedAt: now})
        let savedChapter
        if (chapter.id) {
          savedChapter = await r.table('chapters')
            .get(chapter.id)
            .update(chapterWithTimestamps, {returnChanges: 'always'})
            .run()
        } else {
          chapterWithTimestamps = Object.assign(chapterWithTimestamps, {createdAt: now})
          savedChapter = await r.table('chapters')
            .insert(chapterWithTimestamps, {returnChanges: 'always'})
            .run()
        }

        if (savedChapter.replaced || savedChapter.inserted) {
          return savedChapter.changes[0].new_val
        }
        throw new GraphQLError('Could not save chapter, please try again')
      } catch (err) {
        sentry.captureException(err)
        throw err
      }
    }
  },
}
