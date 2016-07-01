import fs from 'fs'
import path from 'path'
import yaml from 'yamljs'

import {saveQuestions} from '../../server/db/question'
import {saveSurveyBlueprints} from '../../server/db/surveyBlueprint'

export default function reloadSurveyAndQuestionData() {
  return Promise.all([
    saveQuestions(loadFromDataFile('questions')),
    saveSurveyBlueprints(loadFromDataFile('surveyBlueprints')),
  ])
}

function loadFromDataFile(name) {
  const dataFilename = path.resolve(__dirname, '..', '..', 'db', 'data', `${name}.yaml`)
  const data = fs.readFileSync(dataFilename).toString()
  return yaml.parse(data)
}
