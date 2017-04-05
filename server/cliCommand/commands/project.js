import config from 'src/config'

import {userCan} from 'src/common/util'
import {Project, findProjectByNameForPlayer} from 'src/server/services/dataService'
import {LGCLIUsageError, LGNotAuthorizedError} from 'src/server/util/error'

import {deprecatedCommand} from '../util'

async function _setProjectArtifactURL(user, projectName, url) {
  if (!userCan(user, 'setProjectArtifact')) {
    throw new LGNotAuthorizedError()
  }

  const project = await findProjectByNameForPlayer(projectName, user.id)
  return Project.get(project.id).updateWithTimestamp({artifactURL: url})
}

const subcommands = {
  'set-artifact': async (args, {user}) => {
    const [projectNameOrChannel, url] = args._
    const projectName = projectNameOrChannel.replace(/^#/, '')

    await _setProjectArtifactURL(user, projectName, url)

    return {
      text: `Thanks! The artifact for #${projectName} is now set to ${url}`,
    }
  },

  list: async () => {
    const url = `${config.app.baseURL}/projects`
    return deprecatedCommand('/project list', url)
  },
}

export async function invoke(args, options) {
  if (args._.length >= 1) {
    const subcommand = args._[0]
    return await subcommands[subcommand](args.$[subcommand], options)
  }

  throw new LGCLIUsageError()
}
