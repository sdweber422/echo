/* eslint-disable import/imports-first */

// FIXME: replace globals with central (non-global) config
global.__SERVER__ = true

const Promise = require('bluebird')

const getPlayerInfo = require('src/server/actions/getPlayerInfo')
const {findPlayers} = require('src/server/db/player')
const {getProjectById} = require('src/server/db/project')
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
  let players = await findPlayers()
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
    return getProjectById(ps.projectId).then(project => {
      const {elo} = ps
      console.log(`#${project.name}`)
      console.log('----------------------------------------------')
      console.log(`Hours - ${ps.hours}`)
      console.log(`Culture Contribution - ${ps.cultureContribution}%`)
      console.log(`Technical Health - ${ps.technicalHealth}%`)
      console.log(`Team Play - ${ps.teamPlay}%`)
      console.log(`Self-Rated Contribution - ${ps.rcSelf}%`)
      console.log(`Other-Rated Contribution - ${ps.rcOther}%,`)
      console.log(`Overall Contribution - ${ps.relativeContribution}%`)
      console.log(`XP - ${ps.experiencePoints}%`)
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
