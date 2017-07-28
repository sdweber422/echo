/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback */

import moment from 'moment'

import {resolveStartOfWeek} from '../index'

describe(testContext(__filename), function () {
  before(function () {
    this.emptyCycle = {}
    this.cycle = {}
    this.previousCycle = {}
    this.nextCycle = {}
    this.cycle.startTimestamp = '2017-07-27' // Thursday
    this.nextCycle.startTimestamp = '2017-07-28' // Friday
    this.previousCycle.weekStartedAt = '2017-07-17'
  })

  describe('when no date is provided', function () {
    it('should return the date of Monday of current week', function () {
      const startOfWeek = moment(this.emptyCycle).startOf('isoweek').toDate()
      expect(resolveStartOfWeek(this.emptyCycle)).to.eql(startOfWeek)
    })
  })

  describe('when provided parent object has property \'weekStartedAt\'', function () {
    it('should return the same value as \'weekStartedAt\' property', function () {
      expect(resolveStartOfWeek(this.previousCycle)).to.eql(this.previousCycle.weekStartedAt)
    })
  })

  describe('when provided date is not a Friday, Saturday, or Sunday', function () {
    it('should return the date of Monday of that week', function () {
      const startOfWeek = moment(this.cycle.startTimestamp).startOf('isoweek').toDate()
      const startOfNextWeek = moment(this.cycle.startTimestamp).startOf('isoweek').add(7, 'days').toDate()
      const resolvedStartOfWeek = resolveStartOfWeek(this.cycle)

      expect(resolvedStartOfWeek).to.eql(startOfWeek)
      expect(resolvedStartOfWeek).to.not.eql(startOfNextWeek)
    })
  })

  describe('when provided date is a Friday, Saturday, or Sunday', function () {
    it('should return the date of the following Monday', function () {
      const startOfWeek = moment(this.nextCycle.startTimestamp).startOf('isoweek').toDate()
      const startOfNextWeek = moment(this.nextCycle.startTimestamp).startOf('isoweek').add(7, 'days').toDate()
      const resolvedStartOfWeek = resolveStartOfWeek(this.nextCycle)

      expect(resolvedStartOfWeek).to.not.eql(startOfWeek)
      expect(resolvedStartOfWeek).to.eql(startOfNextWeek)
    })
  })
})
