/* eslint-disable key-spacing */

import config from 'src/config'
import graphQLFetcher from 'src/server/util/graphql'
import {avg, sum} from 'src/server/util'
import {Player} from 'src/server/services/dataService'
import getUserSummary from 'src/common/actions/queries/getUserSummary'

import {writeCSV} from './util'

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
        projectHours: project.userProjectStats.projectHours,
        ratingElo:    project.userProjectStats.ratingElo,
        experiencePoints:     getSum('experiencePoints'),
        challenge:            getAvg('challenge'),
        cultureContribution:  getAvg('cultureContribution'),
        estimationAccuracy:   getAvg('estimationAccuracy'),
        estimationBias:       getAvg('estimationBias'),
        flexibleLeadership:   getAvg('flexibleLeadership'),
        frictionReduction:    getAvg('frictionReduction'),
        receptiveness:        getAvg('receptiveness'),
        relativeContribution: getAvg('relativeContribution'),
        resultsFocus:         getAvg('resultsFocus'),
        teamPlay:             getAvg('teamPlay'),
        technicalHealth:      getAvg('technicalHealth'),
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
