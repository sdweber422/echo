import r from '../../db/connect'
import {customQueryError} from './errors'

export const SURVEY_BLUEPRINT_DESCRIPTORS = {
  retrospective: 'retrospective'
}

export const surveysBluprintsTable = r.table('surveyBlueprints')

export function saveSurveyBlueprint(surveyBlueprint) {
  if (surveyBlueprint.id) {
    return update(surveyBlueprint.id, surveyBlueprint)
  }

  if (surveyBlueprint.descriptor) {
    return getSurveyBlueprintByDescriptor(surveyBlueprint.descriptor)
      .then(existingSurveyBlueprint => update(existingSurveyBlueprint.id, surveyBlueprint))
      .catch(() => insert(surveyBlueprint))
  }

  return insert(surveyBlueprint)
}

export function getSurveyBlueprintById(id) {
  return surveysBluprintsTable.get(id)
}

export function getSurveyBlueprintByDescriptor(descriptor) {
  return surveysBluprintsTable.getAll(descriptor, {index: 'descriptor'})
    .nth(0)
    .default(customQueryError(`No Survey Blueprint found with descriptor ${descriptor}`))
}

export function getRetrospectiveSurveyBlueprint() {
  return getSurveyBlueprintByDescriptor(SURVEY_BLUEPRINT_DESCRIPTORS.retrospective)
}

function update(id, surveyBlueprint) {
  const withTimestamps = Object.assign({}, surveyBlueprint, {
    updatedAt: r.now(),
  })
  return surveysBluprintsTable.get(id).update(withTimestamps)
}

function insert(surveyBlueprint) {
  const withTimestamps = Object.assign({}, surveyBlueprint, {
    updatedAt: r.now(),
    createdAt: r.now(),
  })
  return surveysBluprintsTable.insert(withTimestamps)
}
