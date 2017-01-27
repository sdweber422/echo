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
  const fetch = graphQLFetcher(config.server.baseURL)
  const [player] = await Player.limit(1)
  const result = await fetch(getUserSummary(player.id))
  const userSummary = result.data.getUserSummary
  const projectSummaries = userSummary.userProjectSummaries

  const summariesWithPointInTimeStats = addPointInTimeOverallStats(projectSummaries)
  console.log('>>DUMP:', JSON.stringify(summariesWithPointInTimeStats, null, 4))

  return [
    {test: 1},
    {test: 2},
    {test: 3},
    {test: 4},
    {test: 5},
  ]
}

export function addPointInTimeOverallStats(projectSummaries) {
  let result = [...projectSummaries] // COPY
  result.reverse()

  result = result.map((project, i) => {
    const getAvg = getAvgClosure(result, i)
    const getSum = getSumClosure(result, i)

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

  return result.reverse()
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
