import config from 'src/config'
import graphQLFetcher from 'src/server/util/graphql'
import {Player} from 'src/server/services/dataService'
import getUserSummary from 'src/common/actions/queries/getUserSummary'
import addPointInTimeOverallStats from 'src/common/util/addPointInTimeOverallStats'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'

import {writeCSV} from './util'

const {
  PROJECT_HOURS,
  RATING_ELO,
  EXPERIENCE_POINTS,
  CHALLENGE,
  CULTURE_CONTRIBUTION,
  ESTIMATION_ACCURACY,
  ESTIMATION_BIAS,
  FLEXIBLE_LEADERSHIP,
  FRICTION_REDUCTION,
  RECEPTIVENESS,
  RELATIVE_CONTRIBUTION,
  RESULTS_FOCUS,
  TEAM_PLAY,
  TECHNICAL_HEALTH,
  TIME_ON_TASK,
} = STAT_DESCRIPTORS

export default function requestHandler(req, res) {
  return runReport(req.query, res)
    .then(result => writeCSV(result, res))
}

async function runReport() {
  const fetcher = graphQLFetcher(config.server.baseURL)
  const players = await Player.limit(5)

  const playersCycles = (await Promise.all(players.map(player => cyclesForPlayer(player, fetcher))))
    .reduce((allPlayersCycles, playerCycles) => {
      allPlayersCycles = allPlayersCycles.concat(playerCycles)
      return allPlayersCycles
    }, [])
  // console.log('>>DUMP:', JSON.stringify(playersCycles, null, 4))
  return playersCycles
}

async function cyclesForPlayer(player, fetcher) {
  const result = await fetcher(getUserSummary(player.id))
  const {getUserSummary: userSummary} = result.data
  const {userProjectSummaries: projectSummaries} = userSummary
  const summariesWithPointInTimeStats = addPointInTimeOverallStats(projectSummaries)
  const playerColumns = {
    name: userSummary.user.name,
    active: true, // TODO: make this accurate
    id: player.id.split('-')[0],
  }

  return summariesWithPointInTimeStats.map(summary => ({
    ...playerColumns,
    ..._presentProjectSummary(summary)
  }))
}

function _presentProjectSummary(projectSummary) {
  const statNames = [
    PROJECT_HOURS,
    RATING_ELO,
    EXPERIENCE_POINTS,
    CHALLENGE,
    CULTURE_CONTRIBUTION,
    ESTIMATION_ACCURACY,
    ESTIMATION_BIAS,
    FLEXIBLE_LEADERSHIP,
    FRICTION_REDUCTION,
    RECEPTIVENESS,
    RELATIVE_CONTRIBUTION,
    RESULTS_FOCUS,
    TEAM_PLAY,
    TECHNICAL_HEALTH,
    TIME_ON_TASK,
  ]

  const columns = {
    cycle: projectSummary.project.cycle.cycleNumber,
  }
  statNames.forEach(statName => {
    columns[`project_${statName}`] = projectSummary.userProjectStats[statName]
    columns[`overall_${statName}`] = projectSummary.overallStats[statName]
  })

  return columns
}
