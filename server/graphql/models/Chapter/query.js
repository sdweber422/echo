import raven from 'raven'

import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLList} from 'graphql/type'
import {GraphQLError} from 'graphql/error'

import {Chapter} from './schema'

import r from '../../../../db/connect'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export default {
  getChapterById: {
    type: Chapter,
    args: {
      id: {type: new GraphQLNonNull(GraphQLID)}
    },
    async resolve(source, args, {rootValue: {currentUser}}) {
      try {
        if (!currentUser) {
          throw new GraphQLError('You are not authorized to do that.')
        }

        const result = await r.table('chapters').get(args.id).run()
        if (result) {
          return result
        }
        throw new GraphQLError('No such chapter')
      } catch (err) {
        sentry.captureException(err)
        throw err
      }
    }
  },
  getAllChapters: {
    type: new GraphQLList(Chapter),
    async resolve(source, args, {rootValue: {currentUser}}) {
      try {
        if (!currentUser) {
          throw new GraphQLError('You are not authorized to do that.')
        }

        return await r.table('chapters').run()
      } catch (err) {
        sentry.captureException(err)
        throw err
      }
    }
  },
}
