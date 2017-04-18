import fs from 'fs'
import path from 'path'
import yaml from 'yamljs'
import Promise from 'bluebird'

import {
  Question,
  Stat,
  SurveyBlueprint,
  getStatByDescriptor,
  getSurveyBlueprintByDescriptor,
} from 'src/server/services/dataService'

const CONFIG_DIR = path.resolve(__dirname, '..', '..', 'db', 'data')

export default function reloadSurveyAndQuestionData() {
  const questions = _loadFromDataFile(`${CONFIG_DIR}/questions.yaml`)
  const surveyBlueprints = _loadFromDataFile(`${CONFIG_DIR}/surveyBlueprints.yaml`)
  const stats = _loadFromDataFile(`${CONFIG_DIR}/stats.yaml`)

  return Promise.all([
    Question.save(questions, {conflict: 'replace'}),
    Promise.map(surveyBlueprints, surveyBlueprint => (
      _mergeDataForDescriptor(SurveyBlueprint, surveyBlueprint, getSurveyBlueprintByDescriptor)
    )),
    Promise.map(stats, stat => (
      _mergeDataForDescriptor(Stat, stat, getStatByDescriptor)
    )),
  ])
}

function _loadFromDataFile(path) {
  const data = fs.readFileSync(path).toString()
  return yaml.parse(data)
}

async function _mergeDataForDescriptor(Model, data, getByDescriptor) {
  if (!data.id && data.descriptor) {
    try {
      const existingItem = await getByDescriptor(data.descriptor)
      if (existingItem) {
        return Model.get(existingItem.id).updateWithTimestamp(data)
      }
    } catch (err) {
      console.warn(err)
    }
  }

  return Model.save(data, {conflict: 'replace'})
}
