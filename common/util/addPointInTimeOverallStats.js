import {avg, sum} from 'src/common/util'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'

const {
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

export default function addPointInTimeOverallStats(projectSummaries) {
  const summaries = [...projectSummaries].reverse() // COPY

  const summariesWithPointInTimeStats = summaries.map((project, i) => {
    const getAvg = getAvgClosure(summaries, i)
    const getSum = getSumClosure(summaries, i)

    return {
      ...project,
      overallStats: {
        [RATING_ELO]: project.userProjectStats[RATING_ELO],
        [EXPERIENCE_POINTS]: getSum(EXPERIENCE_POINTS),
        [CHALLENGE]: getAvg(CHALLENGE),
        [CULTURE_CONTRIBUTION]: getAvg(CULTURE_CONTRIBUTION),
        [ESTIMATION_ACCURACY]: getAvg(ESTIMATION_ACCURACY),
        [ESTIMATION_BIAS]: getAvg(ESTIMATION_BIAS),
        [FLEXIBLE_LEADERSHIP]: getAvg(FLEXIBLE_LEADERSHIP),
        [FRICTION_REDUCTION]: getAvg(FRICTION_REDUCTION),
        [RECEPTIVENESS]: getAvg(RECEPTIVENESS),
        [RELATIVE_CONTRIBUTION]: getAvg(RELATIVE_CONTRIBUTION),
        [RESULTS_FOCUS]: getAvg(RESULTS_FOCUS),
        [TEAM_PLAY]: getAvg(TEAM_PLAY),
        [TECHNICAL_HEALTH]: getAvg(TECHNICAL_HEALTH),
        [TIME_ON_TASK]: getAvg(TIME_ON_TASK),
      }
    }
  })

  return summariesWithPointInTimeStats.reverse()
}

export function getAvgClosure(list, i) {
  let values = list.slice(0, i + 1)
  values = (values.length > 6) ? values.slice(values.length - 6, values.length) : values
  return name => avg(
    values.map(_ => _.userProjectStats[name])
  )
}

export function getSumClosure(list, i) {
  const values = list.slice(0, i + 1)
  return name => sum(
    values.map(_ => _.userProjectStats[name])
  )
}
