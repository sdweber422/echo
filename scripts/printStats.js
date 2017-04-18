/* eslint-disable import/imports-first */

// FIXME: replace globals with central (non-global) config
global.__SERVER__ = true

const Promise = require('bluebird')

const {
  STAT_DESCRIPTORS: {
    CULTURE_CONTRIBUTION,
    EXPERIENCE_POINTS,
    PROJECT_HOURS,
    RELATIVE_CONTRIBUTION,
    RELATIVE_CONTRIBUTION_OTHER,
    RELATIVE_CONTRIBUTION_SELF,
    TEAM_PLAY,
    TECHNICAL_HEALTH,
  }
} = require('src/common/models/stat')
const getPlayerInfo = require('src/server/actions/getPlayerInfo')
const {Player, Project} = require('src/server/services/dataService')
const {mapById} = require('src/server/util')
const {finish} = require('./util')

const LOG_PREFIX = `[${__filename.split('.js')[0]}]`

const startedAt = new Date()
console.log('startedAt:', startedAt)
run()
  .then(() => finish(null, {startedAt}))
  .catch(err => finish(err, {startedAt}))

async function run() {
  const errors = []

  // retrieve all players & user profile info; sort by handle
  let players = await Player.run()
  const playerUsers = await getPlayerInfo(players.map(p => p.id))
  const playerUserMap = mapById(playerUsers)
  players = players.map(p => {
    return {...p, ...(playerUserMap.get(p.id) || {})}
  }).sort((a, b) => a.handle.localeCompare(b.handle))

  await Promise.each(players, async player => {
    return printPlayerStats(player)
  }).catch(err => errors.push(err))

  if (errors.length > 0) {
    console.error(LOG_PREFIX, 'Errors:')
    errors.forEach(err => console.error('\n', err))
    throw new Error('Player stats printing failed')
  }
}

async function printPlayerStats(player) {
  console.log('\n\n')
  console.log('==============================================')
  console.log(`Stats for player @${player.handle} (${player.name}):`)
  console.log('==============================================\n')
  const {stats} = player
  const {elo, projects} = stats || {}
  const projectStats = Object.keys(projects || {}).map(projectId => ({projectId, ...projects[projectId]}))
  await Promise.all(projectStats.map(ps => {
    return Project.get(ps.projectId).then(project => {
      const {elo} = ps
      console.log(`#${project.name}`)
      console.log('----------------------------------------------')
      console.log(`Hours - ${ps[PROJECT_HOURS]}`)
      console.log(`Culture Contribution - ${ps[CULTURE_CONTRIBUTION]}%`)
      console.log(`Technical Health - ${ps[TECHNICAL_HEALTH]}%`)
      console.log(`Team Play - ${ps[TEAM_PLAY]}%`)
      console.log(`Self-Rated Contribution - ${ps[RELATIVE_CONTRIBUTION_SELF]}%`)
      console.log(`Other-Rated Contribution - ${ps[RELATIVE_CONTRIBUTION_OTHER]}%,`)
      console.log(`Overall Contribution - ${ps[RELATIVE_CONTRIBUTION]}%`)
      console.log(`XP - ${ps[EXPERIENCE_POINTS]}%`)
      if (elo) {
        console.log(`Elo: Score - ${elo.score}, Matches - ${elo.matches}, K Factor - ${elo.kFactor}, Rating: ${elo.rating}`)
      } else {
        console.log('Elo: None')
      }
      console.log('\n')
    })
  }))
  console.log('Overall Elo:', elo)
}
