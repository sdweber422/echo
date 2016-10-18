/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {withDBCleanup} from 'src/test/helpers'

import {
  getStatByDescriptor,
  saveStat,
  getStatById,
  statsTable,
} from 'src/server/db/stat'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('getStatByDescriptor()', function () {
    beforeEach(function () {
      return factory.create('stat', {descriptor: 'myDescriptor'})
        .then(stat => {
          this.stat = stat
        })
    })

    it('returns the correct stat', function () {
      return expect(
        getStatByDescriptor('myDescriptor')
      ).to.eventually.deep.eq(this.stat)
    })
  })

  describe('saveStat()', function () {
    beforeEach(function () {
      return factory.create('stat', {descriptor: 'myDescriptor'})
        .then(stat => {
          this.stat = stat
        })
    })

    it('updates existing record when id provided', function () {
      const updatedStat = Object.assign({}, this.stat, {newAttr: 'newVal'})
      return saveStat(updatedStat)
        .then(() => getStatById(this.stat.id))
        .then(savedRecord => expect(savedRecord).to.have.property('newAttr', 'newVal'))
    })

    it('updates existing record when id missing but descriptor provided', function () {
      const updatedStat = Object.assign({}, this.stat, {newAttr: 'newVal'})
      delete updatedStat.id
      return saveStat(updatedStat)
        .then(() => getStatById(this.stat.id))
        .then(savedRecord => expect(savedRecord).to.have.property('newAttr', 'newVal'))
    })

    it('saves a new record when new id provided', async function () {
      const newStat = await factory.build('stat')
      await saveStat(newStat)
      const count = await statsTable.count()
      expect(count).to.eq(2)
    })

    it('saves a new record when new descriptor provided', async function () {
      const newStat = await factory.build('stat')
      delete newStat.id
      await saveStat(newStat)
      const count = await statsTable.count()
      expect(count).to.eq(2)
    })
  })
})
