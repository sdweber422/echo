/* eslint-disable no-console, camelcase */
import r from '../db/connect'
import {getQueue} from './util'

function newChapters() {
  const newChapterQueue = getQueue('newChapter')

  r.table('chapters').changes().filter(r.row('old_val').eq(null))
    .then(cursor => {
      cursor.each((err, {new_val: chapter}) => {
        if (!err) {
          console.log('adding new chapter to newChapter queue:', chapter)
          newChapterQueue.add(chapter)
        }
      })
    })
}

export default function configureChangeFeeds() {
  newChapters()
}
