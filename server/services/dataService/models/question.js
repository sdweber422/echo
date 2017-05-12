import fs from 'fs'
import path from 'path'
import yaml from 'yamljs'

import {QUESTION_SUBJECT_TYPES, QUESTION_RESPONSE_TYPES} from 'src/common/models/survey'

const DATA_FILE_PATH = path.resolve(__dirname, './data/questions.yaml')

export default function questionModel(thinky) {
  const {r, type: {string, date, boolean, object}} = thinky

  return {
    name: 'Question',
    table: 'questions',
    schema: {
      id: string()
        .uuid(4)
        .allowNull(false),

      statId: string()
        .uuid(4)
        .allowNull(false),

      body: string()
        .allowNull(false)
        .default(true),

      subjectType: string()
        .enum(Object.values(QUESTION_SUBJECT_TYPES))
        .allowNull(false),

      responseType: string()
        .enum(Object.values(QUESTION_RESPONSE_TYPES))
        .allowNull(false),

      validationOptions: object()
        .allowNull(false)
        .allowExtra(true)
        .default({}),

      active: boolean()
        .allowNull(false)
        .default(true),

      createdAt: date()
        .allowNull(false)
        .default(r.now()),

      updatedAt: date()
        .allowNull(false)
        .default(r.now()),
    },
    associate: (Question, models) => {
      Question.belongsTo(models.Stat, 'stat', 'statId', 'id', {init: false})
    },
    static: {
      async reload() {
        const data = fs.readFileSync(DATA_FILE_PATH).toString()
        const questions = await yaml.parse(data)
        return this.save(questions, {conflict: 'replace'})
      },
    },
  }
}
