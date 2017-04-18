import r from '../r'
import getSurveyResponsesForPlayer from './getSurveyResponsesForPlayer'

export default function findProjectsAndReviewResponsesForPlayer(chapterId, cycleId, playerId) {
  return r.table('projects').filter({chapterId, cycleId})
    .hasFields('projectReviewSurveyId')
    .merge(project => ({
      projectReviewResponses: r.table('surveys').get(project('projectReviewSurveyId'))
        .do(survey => survey('questionRefs')
          .map(questionRef => ({
            name: questionRef('name'),
            value: getSurveyResponsesForPlayer(playerId, survey('id'), questionRef('questionId'))
              .nth(0).default(r.object('value', null))('value'),
          }))
        )
    }))
    .orderBy('name')
}
