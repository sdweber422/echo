import raven from 'raven'

import {GraphQLNonNull} from 'graphql'
import {GraphQLURL} from 'graphql-custom-types'
import {GraphQLError} from 'graphql/error'

import {userCan} from '../../../../common/util'
import {getPlayerById} from '../../../db/player'
import {getLatestCycleForChapter} from '../../../db/cycle'
import {update as updateProject, findProjectByPlayerIdAndCycleId} from '../../../db/project'

import {ThinProject} from './schema'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export default {
  setProjectArtifactURL: {
    type: ThinProject,
    args: {
      url: {type: new GraphQLNonNull(GraphQLURL)},
    },
    async resolve(source, {url}, {rootValue: {currentUser}}) {
      if (!userCan(currentUser, 'updateProject')) {
        throw new GraphQLError('You are not authorized to do that.')
      }
      try {
        const player = await getPlayerById(currentUser.id, {mergeChapter: true})
        const cycle = await getLatestCycleForChapter(player.chapter.id)
        const project = await findProjectByPlayerIdAndCycleId(player.id, cycle.id)
        project.artifactURL = url
        const result = await updateProject(project, {returnChanges: true})
        if (result.replaced) {
          return result.changes[0].new_val
        }
      } catch (err) {
        sentry.captureException(err)
        throw err
      }
    }
  },
}
