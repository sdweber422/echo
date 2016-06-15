import fs from 'fs'
import path from 'path'
import yaml from 'yamljs'

import {saveQuestion} from '../../server/db/question'

export default function updateRetrospectiveQuestions(questions = getConfiguredRetrospectiveQuestions()) {
  const saveQuestionPromises = questions
    .map(question => saveQuestion(question))
  return Promise.all(saveQuestionPromises)
}

function getConfiguredRetrospectiveQuestions() {
  const dataFilename = path.resolve(__dirname, '..', '..', 'db', 'data', 'surveys', 'retrospective.yaml')
  const data = fs.readFileSync(dataFilename).toString()
  const retrospectiveQuestionMap = yaml.parse(data)
  return Object.keys(retrospectiveQuestionMap)
    .map(id => Object.assign({}, retrospectiveQuestionMap[id], {id}))
}
