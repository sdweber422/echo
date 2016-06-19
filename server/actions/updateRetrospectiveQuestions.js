import fs from 'fs'
import path from 'path'
import yaml from 'yamljs'

import {saveQuestion} from '../../server/db/question'
import {saveSurveyBlueprint} from '../../server/db/surveyBlueprint'
import {SURVEY_BLUEPRINT_DESCRIPTORS} from '../../common/models/surveyBlueprint'

export default function updateRetrospectiveQuestions(questions = getConfiguredRetrospectiveQuestions()) {
  const saveQuestionPromises = questions
    .map(question => saveQuestion(question))
  return Promise.all(saveQuestionPromises)
    .then(() => updateRetroSurveyBlueprint(questions.map(q => q.id)))
}

function getConfiguredRetrospectiveQuestions() {
  const dataFilename = path.resolve(__dirname, '..', '..', 'db', 'data', 'surveys', 'retrospective.yaml')
  const data = fs.readFileSync(dataFilename).toString()
  const retrospectiveQuestionMap = yaml.parse(data)
  return Object.keys(retrospectiveQuestionMap)
    .map(id => Object.assign({}, retrospectiveQuestionMap[id], {id}))
}

function updateRetroSurveyBlueprint(questionIds) {
  return saveSurveyBlueprint({
    descriptor: SURVEY_BLUEPRINT_DESCRIPTORS.retrospective,
    defaultQuestionIds: questionIds
  })
}
