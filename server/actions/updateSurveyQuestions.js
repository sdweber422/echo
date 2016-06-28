import fs from 'fs'
import path from 'path'
import yaml from 'yamljs'

import {saveQuestions} from '../../server/db/question'
import {saveSurveyBlueprint} from '../../server/db/surveyBlueprint'
import {RETROSPECTIVE, PROJECT_REVIEW} from '../../common/models/surveyBlueprint'

export default async function updateSurveyQuestions() {
  await updateRetrospectiveQuestions()
  await updateProjectReviewQuestions()
}

export function updateRetrospectiveQuestions(questions = getConfiguredQuestions(RETROSPECTIVE)) {
  return saveQuestions(questions)
    .then(() => saveSurveyBlueprint({
      descriptor: RETROSPECTIVE,
      defaultQuestionRefs: questions.map(q => ({questionId: q.id})),
    }))
}

export function updateProjectReviewQuestions(questions = getConfiguredQuestions(PROJECT_REVIEW)) {
  return saveQuestions(questions)
    .then(() => saveSurveyBlueprint({
      descriptor: PROJECT_REVIEW,
      defaultQuestionRefs: questions.map(q => ({
        questionId: q.id,
        name: (q.body.match(/complete/) ? 'completeness' : 'quality')
      }))
    }))
}

function getConfiguredQuestions(surveyBlueprintDescriptor) {
  const dataFilename = path.resolve(__dirname, '..', '..', 'db', 'data', 'surveys', `${surveyBlueprintDescriptor}.yaml`)
  const data = fs.readFileSync(dataFilename).toString()
  const questionMap = yaml.parse(data)
  return Object.keys(questionMap)
    .map(id => Object.assign({}, questionMap[id], {id}))
}
