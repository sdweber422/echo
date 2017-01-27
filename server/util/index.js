import fs from 'fs'

export function loadJSON(filePath, validateItem = item => item) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        return reject(err)
      }

      try {
        const items = JSON.parse(data)

        if (!Array.isArray(items)) {
          return reject(new Error('File parse error: data must be a JSON array'))
        }

        resolve(items.map(validateItem))
      } catch (err) {
        reject(err)
      }
    })
  })
}

export {
  sum,
  median,
  avg,
  toPercent,
  toArray,
  toPairs,
  pickRandom,
  mapById,
  groupById,
  safePushInt,
  unique,
  range,
  repeat,
  choose,
  factorial,
  sortByAttr,
  attrCompareFn,
  shuffle,
  segment,
  flatten,
  slugify,
  toSortedArray,
  roundDecimal,
  findAny,
} from 'src/common/util'
