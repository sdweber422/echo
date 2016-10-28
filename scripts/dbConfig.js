import fs from 'fs'
import path from 'path'
import {options} from 'src/db'
import {finish} from './util'

const outputPath = path.resolve(__dirname, '../db/database.json')

fs.writeFile(outputPath, JSON.stringify(options), finish)
