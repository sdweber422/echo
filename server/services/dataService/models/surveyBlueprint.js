import fs from 'fs'
import path from 'path'
import yaml from 'yamljs'
import Promise from 'bluebird'

import getSurveyBlueprintByDescriptor from '../queries/getSurveyBlueprintByDescriptor'

const DATA_FILE_PATH = path.resolve(__dirname, './data/surveyBlueprints.yaml')

export default function surveyBlueprintModel(thinky) {
  const {r, type: {string, date, array}} = thinky

  return {
    name: 'SurveyBlueprint',
    table: 'surveyBlueprints',
    schema: {
      id: string()
        .uuid(4)
        .allowNull(false),

      descriptor: string()
        .allowNull(false),

      defaultQuestionRefs: array()
        .allowNull(false),

      createdAt: date()
        .allowNull(false)
        .default(r.now()),

      updatedAt: date()
        .allowNull(false)
        .default(r.now()),
    },
    static: {
      async reload() {
        const data = fs.readFileSync(DATA_FILE_PATH).toString()
        const surveyBlueprints = yaml.parse(data)

        return Promise.map(surveyBlueprints, async surveyBlueprint => {
          // merge by unique descriptors
          if (!surveyBlueprint.id && surveyBlueprint.descriptor) {
            try {
              const existingSurveyBlueprint = await getSurveyBlueprintByDescriptor(surveyBlueprint.descriptor)
              if (existingSurveyBlueprint) {
                return this
                  .get(existingSurveyBlueprint.id)
                  .updateWithTimestamp(surveyBlueprint)
              }
            } catch (err) {
              console.warn(err)
            }
          }

          return this.save(surveyBlueprint, {conflict: 'replace'})
        })
      },
    },
  }
}
