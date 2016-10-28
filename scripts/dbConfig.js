/* eslint-disable xo/no-process-exit */
import fs from 'fs'
import path from 'path'
import {options} from 'src/db'

const outputPath = path.resolve(__dirname, '../db/database.json')

fs.writeFile(outputPath, JSON.stringify(options), err => {
  if (err) {
    console.error(err)
    process.exit(1)
  } else {
    process.exit(0)
  }
})
