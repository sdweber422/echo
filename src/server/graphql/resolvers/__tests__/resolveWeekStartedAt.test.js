/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback */

import moment from 'moment'

import {resolveWeekStartedAt} from '../index'

describe(testContext(__filename), function () {
  describe('when parent `weekStartedAt` is present', function () {
    it('returns the same value as `weekStartedAt`', function () {
      const parent = {weekStartedAt: new Date(2017, 6, 17)}
      const result = resolveWeekStartedAt(parent)
      expect(result).to.eql(parent.weekStartedAt)
    })
  })

  describe('when parent `startTimestamp` is a Monday', function () {
    it('should return the date of Monday of that week', function () {
      const parent = {startTimestamp: new Date(2017, 6, 24)}
      const result = resolveWeekStartedAt(parent)
      _expectDateEqualToSameMonday(parent.startTimestamp, result)
    })
  })

  describe('when parent `startTimestamp` is a Tuesday', function () {
    it('should return the date of Monday of that week', function () {
      const parent = {startTimestamp: new Date(2017, 6, 25)}
      const result = resolveWeekStartedAt(parent)
      _expectDateEqualToSameMonday(parent.startTimestamp, result)
    })
  })

  describe('when parent `startTimestamp` is a Wednesday', function () {
    it('should return the date of Monday of that week', function () {
      const parent = {startTimestamp: new Date(2017, 6, 26)}
      const result = resolveWeekStartedAt(parent)
      _expectDateEqualToSameMonday(parent.startTimestamp, result)
    })
  })

  describe('when parent `startTimestamp` is a Thursday', function () {
    it('should return the date of Monday of that week', function () {
      const parent = {startTimestamp: new Date(2017, 6, 27)}
      const result = resolveWeekStartedAt(parent)
      _expectDateEqualToSameMonday(parent.startTimestamp, result)
    })
  })

  describe('when parent `startTimestamp` is a Friday', function () {
    it('should return the date of the following Monday', function () {
      const parent = {startTimestamp: new Date(2017, 6, 28)}
      const result = resolveWeekStartedAt(parent)
      _expectDateEqualToFollowingMonday(parent.startTimestamp, result)
    })
  })

  describe('when parent `startTimestamp` is a Saturday', function () {
    it('should return the date of the following Monday', function () {
      const parent = {startTimestamp: new Date(2017, 6, 29)}
      const result = resolveWeekStartedAt(parent)
      _expectDateEqualToFollowingMonday(parent.startTimestamp, result)
    })
  })

  describe('when parent `startTimestamp` is a Sunday', function () {
    it('should return the date of the following Monday', function () {
      const parent = {startTimestamp: new Date(2017, 6, 30)}
      const result = resolveWeekStartedAt(parent)
      _expectDateEqualToFollowingMonday(parent.startTimestamp, result)
    })
  })

  describe('when parent `createdAt` is a Tuesday and has no `startTimestamp`', function () {
    it('should return the date of Monday of same week', function () {
      const parent = {createdAt: new Date()}
      const result = resolveWeekStartedAt(parent)
      _expectDateEqualToSameMonday(parent.createdAt, result)
    })
  })

  describe('when parent has neither `startTimestamp` nor `createdAt`', function () {
    it('should return the date of Monday of current week', function () {
      const parent = {}
      const result = resolveWeekStartedAt(parent)
      _expectDateEqualToCurrentMonday(result)
    })
  })
})

function _expectDateEqualToSameMonday(inputDate, outputDate) {
  const startOfSameWeek = moment(inputDate).startOf('isoweek').toDate()
  expect(outputDate.getTime()).to.eq(startOfSameWeek.getTime(), `Expected ${outputDate} to equal ${startOfSameWeek}`)
}

function _expectDateEqualToFollowingMonday(inputDate, outputDate) {
  const startOfFollowingWeek = moment(inputDate).add(7, 'days').startOf('isoweek').toDate()
  expect(outputDate.getTime()).to.eq(startOfFollowingWeek.getTime(), `Expected ${outputDate} to equal ${startOfFollowingWeek}`)
}

function _expectDateEqualToCurrentMonday(outputDate) {
  const startOfCurrentWeek = moment().startOf('isoweek').toDate()
  expect(outputDate.getTime()).to.eq(startOfCurrentWeek.getTime(), `Expected ${outputDate} to equal ${startOfCurrentWeek}`)
}
