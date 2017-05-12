import fs from 'fs'
import path from 'path'
import yaml from 'yamljs'
import Promise from 'bluebird'

import getStatByDescriptor from '../queries/getStatByDescriptor'

const DATA_FILE_PATH = path.resolve(__dirname, './data/stats.yaml')

export default function statModel(thinky) {
  const {r, type: {string, date}} = thinky

  return {
    name: 'Stat',
    table: 'stats',
    schema: {
      id: string()
        .uuid(4)
        .allowNull(false),

      descriptor: string()
        .allowNull(false)
        .default(true),

      createdAt: date()
        .allowNull(false)
        .default(r.now()),

      updatedAt: date()
        .allowNull(false)
        .default(r.now()),
    },
    associate: (Stat, models) => {
      Stat.hasMany(models.Question, 'questions', 'id', 'statId', {init: false})
    },
    static: {
      async reload() {
        const data = fs.readFileSync(DATA_FILE_PATH).toString()
        const stats = yaml.parse(data)

        return Promise.map(stats, async stat => {
          // merge by unique descriptors
          if (!stat.id && stat.descriptor) {
            try {
              const existingStat = await getStatByDescriptor(stat.descriptor)
              if (existingStat) {
                return this
                  .get(existingStat.id)
                  .updateWithTimestamp(stat)
              }
            } catch (err) {
              console.warn(err)
            }
          }

          return this.save(stat, {conflict: 'replace'})
        })
      },
    },
  }
}
