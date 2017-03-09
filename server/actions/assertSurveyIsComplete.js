import {surveyProgress} from 'src/common/models/survey'
import {getFullSurveyForPlayerById} from 'src/server/db/survey'
import {LGBadInputError} from 'src/server/util/error'

export default async function assertSurveyIsComplete(surveyId, respondentId) {
  const fullSurvey = await getFullSurveyForPlayerById(respondentId, surveyId)
  const {completed} = surveyProgress(fullSurvey)
  if (!completed) {
    throw new LGBadInputError('Missing survey responses')
  }
  return fullSurvey
}
