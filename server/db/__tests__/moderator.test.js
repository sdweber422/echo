/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import {getModeratorById} from '../moderator'
import factory from '../../../test/factories'
import {withDBCleanup} from '../../../test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('getModeratorById', function () {
    beforeEach(function () {
      return factory.create('moderator').then(moderator => {
        this.moderator = moderator
      })
    })

    it('returns a shallow moderator by default', function () {
      return getModeratorById(this.moderator.id)
        .then(moderator => {
          expect(moderator).to.have.property('chapterId')
          expect(moderator).to.not.have.property('chapter')
        })
    })

    it('merges in the chapter info when requested', function () {
      return getModeratorById(this.moderator.id, {mergeChapter: true})
        .then(moderator => {
          expect(moderator).to.not.have.property('chapterId')
          expect(moderator).to.have.property('chapter')
          expect(moderator.chapter).to.have.property('id')
          expect(moderator.chapter).to.have.property('name')
        })
    })
  })
})
