import {Project, Survey} from 'src/server/services/dataService'
import {LGBadRequestError} from 'src/server/util/error'

export async function unlockRetroSurveyForUser(playerId, projectId) {
  const survey = await _getCompletedRetrospectiveSurvey(playerId, projectId)
  const unlockedFor = _without(survey.unlockedFor, playerId)
  unlockedFor.push(playerId)
  await Survey.get(survey.id).updateWithTimestamp({unlockedFor})
}

export async function lockRetroSurveyForUser(playerId, projectId) {
  const survey = await _getCompletedRetrospectiveSurvey(playerId, projectId)
  await Survey
    .get(survey.id)
    .updateWithTimestamp({
      unlockedFor: _without(survey.unlockedFor, playerId)
    })
}

async function _getCompletedRetrospectiveSurvey(playerId, projectId) {
  const {retrospectiveSurvey} = await Project.get(projectId).getJoin({retrospectiveSurvey: true})
  if (!retrospectiveSurvey.completedBy.includes(playerId)) {
    throw new LGBadRequestError('Cannot lock or unlock an incomplete survey')
  }
  return retrospectiveSurvey
}

function _without(values, excludedValue) {
  return (values || []).filter(value => value !== excludedValue)
}
