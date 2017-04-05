import {surveyProgress} from 'src/common/models/survey'
import {getFullSurveyForPlayerById} from 'src/server/services/dataService'
import {LGBadRequestError} from 'src/server/util/error'

export default async function assertSurveyIsComplete(surveyId, respondentId) {
  const fullSurvey = await getFullSurveyForPlayerById(respondentId, surveyId)
  const {completed} = surveyProgress(fullSurvey)
  if (!completed) {
    throw new LGBadRequestError('Missing survey responses')
  }
  return fullSurvey
}
