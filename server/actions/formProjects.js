/**
 * Forms projects for teams of players who have voted on goals for a cycle.
 * Makes something of a best-effort attempt to assign each non-advanced player
 * to a project team that will work on their most-preferred goal.
 */

import {getCycleById} from 'src/server/db/cycle'
import {findPlayersByIds} from 'src/server/db/player'
import {findVotesForCycle} from 'src/server/db/vote'
import {insertProjects} from 'src/server/db/project'
import {toArray, mapById} from 'src/server/util'
import generateProjectName from 'src/server/actions/generateProjectName'
// TODO: rename service teamFormationService
import getTeamFormationPlan from 'src/server/services/projectFormationService/actions/getTeamFormationPlan'

import config from 'src/config'

const MIN_ADVANCED_PLAYER_ELO = config.server.projects.advancedPlayerMinElo
const MIN_ADVANCED_PLAYER_XP = config.server.projects.advancedPlayerMinXp
const MAX_ADVANCED_PLAYERS = config.server.projects.advancedPlayerMaxNum

export default async function formProjects(cycleId) {
  const pool = await _buildPool(cycleId)

  const teamFormationPlan = getTeamFormationPlan(pool)

  const projects = await _teamFormationPlanToProjects(teamFormationPlan, pool, cycleId)

  return insertProjects(projects)
}

async function _teamFormationPlanToProjects(teamFormationPlan, pool) {
  const cycle = await getCycleById(pool.cycleId)
  return Promise.all(
    teamFormationPlan.teams.map(team =>
      generateProjectName().then(name => ({
        chapterId: cycle.chapterId,
        name,
        goal: pool.goals.find(g => g.goalDescriptor === team.goalDescriptor),
        cycleHistory: [
          {
            cycleId: pool.cycleId,
            playerIds: team.playerIds,
          }
        ]
      }))
    )
  )
}

async function _buildPool(cycleId) {
  const cycleVotes = await findVotesForCycle(cycleId).run()

  if (!cycleVotes.length) {
    throw new Error('No votes submitted for cycle')
  }

  const players = await _getPlayersWhoVoted(cycleVotes)

  const votes = cycleVotes.map(({goals, playerId}) => ({playerId, votes: goals.map(({url}) => url)}))
  const goalsByUrl = _extractGoalsFromVotes(cycleVotes)
  const goals = [...goalsByUrl.values()].map(goal => {
    return {goalDescriptor: goal.url, ...goal}
  })
  const advancedPlayers = _getAdvancedPlayersWithTeamLimits([...players.values()])
  return {goals, votes, advancedPlayers, cycleId}
}

async function _getPlayersWhoVoted(cycleVotes) {
  const playerVotes = _mapVotesByPlayerId(cycleVotes)
  const votingPlayerIds = Array.from(playerVotes.keys())
  const cyclePlayers = await findPlayersByIds(votingPlayerIds).run()

  return mapById(cyclePlayers)
}

function _getAdvancedPlayersWithTeamLimits(players) {
  const MIN_PRO_PLAYER_ELO = MIN_ADVANCED_PLAYER_ELO
  return players
    .filter(player => _playerXp(player) >= MIN_ADVANCED_PLAYER_XP)
    .map(player => [_playerElo(player), player])
    .sort((a, b) => b.elo - a.elo)
    .filter(([elo]) => {
      return elo >= MIN_ADVANCED_PLAYER_ELO
    })
    .map(([elo, player]) => {
      const maxTeams = elo >= MIN_PRO_PLAYER_ELO ? 5 : 1
      return {id: player.id, maxTeams}
    })
    .slice(0, MAX_ADVANCED_PLAYERS)
}

function _extractGoalsFromVotes(votes) {
  votes = toArray(votes)
  return votes.reduce((result, vote) => {
    if (Array.isArray(vote.goals)) {
      vote.goals.forEach(goal => {
        if (goal.url && !result.has(goal.url)) {
          result.set(goal.url, goal)
        }
      })
    }
    return result
  }, new Map())
}

function _mapVotesByPlayerId(votes) {
  votes = toArray(votes)
  return votes.reduce((result, vote) => {
    result.set(vote.playerId, {
      goals: Array.isArray(vote.goals) ? vote.goals.slice(0) : []
    })
    return result
  }, new Map())
}

function _playerElo(player) {
  return parseInt(((player.stats || {}).elo || {}).rating, 10) || 0
}

function _playerXp(player) {
  return (player.stats || {}).xp || 0
}
