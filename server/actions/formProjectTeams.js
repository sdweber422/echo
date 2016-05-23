import animal from 'animal-id'
import {graphql} from 'graphql'
import r from '../../db/connect'
import rootSchema from '../graphql/rootSchema'
import {graphQLErrorHander} from '../../common/util/getGraphQLFetcher'

function getCycleVotingResults(cycleId) {
  const query = `
    query($cycleId: ID!) {
      getCycleVotingResults(cycleId: $cycleId) {
        id
        cycle {
          id
          chapter {
            id
            name
            channelName
            goalRepositoryURL
          }
        }
        numEligiblePlayers
        numVotes
        candidateGoals {
          goal {
            url
            title
          }
          playerGoalRanks {
            playerId
            goalRank
          }
        }
      }
    }
  `

  return graphql(rootSchema, query, {currentUser: true}, {cycleId})
    .then(graphQLErrorHander)
    .then(results => results.data.getCycleVotingResults)
}

module.exports.forTesting = {}
module.exports.forTesting = {getTeamSizes}
function getTeamSizes(playerCount, target=4) {
  const absoluteMinumum = 3
  const min = target - 1

  const div = Math.floor(playerCount / target)
  const remainder = playerCount % target

  if (remainder === 0) {
    return Array.from({length: div}, () => target)
  }

  if (remainder >= min) {
    const perfectTeams = Array.from({length: div}, () => target)
    return perfectTeams.concat(remainder)
  }

  if (remainder < min && div >= remainder) {
    const perfectTeams = Array.from({length: div - remainder}, () => target)
    const largerTeams = Array.from({length: remainder}, () => target + 1)
    return perfectTeams.concat(...largerTeams)
  }

  if (target > absoluteMinumum) {
    return getTeamSizes(playerCount, target-1)
  }

  throw Error('I cannot figure what the team sizes should be!')
}

export async function formProjectTeams(cycleId) {
  try {
    const votingResults = await getCycleVotingResults(cycleId)
    // console.log(votingResults.candidateGoals.map(g => g.playerGoalRanks))
    const chapterPlayers = await r.table('players').getAll(votingResults.cycle.chapter.id, {index: 'chapterId'}).run()

    // 1. Figure out how many teams there need to be for 3-5 players each
    const teamSizes = getTeamSizes(chapterPlayers.length)

    // 2. get that many goals (using the ones with the most votes)
    const candidateGoals = votingResults.candidateGoals.slice(0, teamSizes.length)

    // 3. create 1 project for each goal
    const now = new Date()
    return Promise.all(candidateGoals.map((candidateGoal, i) => {
      const goalUrl = candidateGoal.goal.url
      const team = chapterPlayers.splice(0, teamSizes[i])

      return r.table('projects').insert({
        goalUrl: goalUrl,
        // TODO: add unique index on this name
        name: animal.getId(),
        chapterId: votingResults.cycle.chapter.id,
        cycleTeams: {
          [cycleId]: { playerIds: team.map(p => p.id) }
        },
        createdAt: now,
        updatedAt: now,
      }).run()
    }))

    // TODO:
    //   * use very popular goals for more than one project
    //   *
    //
  } catch (e) {
    throw(e)
  }
}
