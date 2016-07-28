/* eslint-env mocha */
/* global testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
// import React from 'react'
// import {shallow} from 'enzyme'

describe(testContext(__filename), function () {
  describe('props.options', function () {
    describe('props.options[n]', function () {
      describe('option.label', function () {
        it('renders the label')
      })
    })
  })

  describe('props.value', function () {
    it('pre-selects the radio button for the option with the value matching the provided value')
  })

  describe('props.name, props.options[n].value, props.onChange', function () {
    it('invokes the provided callback, passing name and the value for a selected option')
  })
})
