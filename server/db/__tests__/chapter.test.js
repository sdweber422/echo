/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {withDBCleanup} from 'src/test/helpers'

import {
  saveChapter,
  getChapterById,
  chaptersTable,
} from 'src/server/db/chapter'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('saveChapter()', function () {
    beforeEach(async function () {
      this.chapter = await factory.create('chapter')
    })

    it('updates existing record when id provided', function () {
      const updatedChapter = Object.assign({}, this.chapter, {newAttr: 'newVal'})
      return saveChapter(updatedChapter)
        .then(() => getChapterById(this.chapter.id))
        .then(savedRecord => expect(savedRecord).to.have.property('newAttr', 'newVal'))
    })

    it('saves a new record when new id provided', async function () {
      const newChapter = await factory.build('chapter')
      await saveChapter(newChapter)
      const count = await chaptersTable.count()
      expect(count).to.eq(2)
    })
  })
})
