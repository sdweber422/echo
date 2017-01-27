/* eslint-disable key-spacing */

import config from 'src/config'
import graphQLFetcher from 'src/server/util/graphql'
import {avg, sum} from 'src/server/util'
import {Player} from 'src/server/services/dataService'
import getUserSummary from 'src/common/actions/queries/getUserSummary'
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

export function addPointInTimeOverallStats(projectSummaries) {
  const summaries = [...projectSummaries].reverse() // COPY

  const summariesWithPointInTimeStats = summaries.map((project, i) => {
    const getAvg = getAvgClosure(summaries, i)
    const getSum = getSumClosure(summaries, i)

    return {
      ...project,
      overallStats: {
        [PROJECT_HOURS]:         project.userProjectStats[PROJECT_HOURS],
        [RATING_ELO]:            project.userProjectStats[RATING_ELO],
        [EXPERIENCE_POINTS]:     getSum(EXPERIENCE_POINTS),
        [CHALLENGE]:             getAvg(CHALLENGE),
        [CULTURE_CONTRIBUTION]:  getAvg(CULTURE_CONTRIBUTION),
        [ESTIMATION_ACCURACY]:   getAvg(ESTIMATION_ACCURACY),
        [ESTIMATION_BIAS]:       getAvg(ESTIMATION_BIAS),
        [FLEXIBLE_LEADERSHIP]:   getAvg(FLEXIBLE_LEADERSHIP),
        [FRICTION_REDUCTION]:    getAvg(FRICTION_REDUCTION),
        [RECEPTIVENESS]:         getAvg(RECEPTIVENESS),
        [RELATIVE_CONTRIBUTION]: getAvg(RELATIVE_CONTRIBUTION),
        [RESULTS_FOCUS]:         getAvg(RESULTS_FOCUS),
        [TEAM_PLAY]:             getAvg(TEAM_PLAY),
        [TECHNICAL_HEALTH]:      getAvg(TECHNICAL_HEALTH),
        [TIME_ON_TASK]:          getAvg(TIME_ON_TASK),
      }
    }
  })

  return summariesWithPointInTimeStats.reverse()
}

function getAvgClosure(list, i) {
  const slice = list.slice(0, i + 1)
  return name => avg(
    slice.map(_ => _.userProjectStats[name])
  )
}

function getSumClosure(list, i) {
  const slice = list.slice(0, i + 1)
  return name => sum(
    slice.map(_ => _.userProjectStats[name])
  )
}
