import config from 'src/config'
import {flatten} from 'src/common/util'

import {
  githubReposForLevel,
  herokuAppsForLevel,
  getAPIGrantPromises,
} from 'src/server/actions/playerLevelPermissionGrants'
import {Player} from 'src/server/services/dataService'
import findUsers from 'src/server/actions/findUsers'
import {finish} from './util'

async function ensurePlayersCanCollaborate() {
  const permissions = config.levels.permissions
  const levels = Object.keys(permissions).map(levelStr => parseInt(levelStr, 10))

  const getPromisesForLevels = async level => {
    const players = await Player.filter(player => player('stats')('level').eq(level))
    const users = await findUsers(players.map(player => player.id))

    const promises = await getAPIGrantPromises(users, githubReposForLevel(level), herokuAppsForLevel(level))
    console.info(`Setting up collaboration for level ${level} players ...`)
    return promises
  }

  const levelPromises = levels.map(level => getPromisesForLevels(level))
  const nestedArrayOfPromises = await Promise.all(levelPromises)
  await Promise.all(flatten(nestedArrayOfPromises))
}

if (!module.parent) {
  ensurePlayersCanCollaborate()
    .then(() => finish())
    .catch(finish)
}
