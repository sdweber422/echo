/* eslint-env mocha */
/* global testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
// import React from 'react'
// import {shallow} from 'enzyme'

describe(testContext(__filename), function () {
  describe('props.hint', function () {
    it('renders the hint')
  })

  describe('props.options', function () {
    describe('props.options[n]', function () {
      describe('option.label', function () {
        it('renders the label in an anchor element')
      })

      describe('option.tooltip', function () {
        it('sets the text attribute of the anchor element to the tooltip value')
      })

      describe('option.url', function () {
        it('sets the href attribute of the anchor element to the url value')
      })
    })
  })

  describe('props.sum', function () {
    it('restricts value changes to less than or equal to specified sum')
  })

  describe('props.value', function () {
    it('sets the value of sliders to any provided initial values')

    it('sets the value of sliders without provided values to 0')
  })

  describe('props.name, props.onChange', function () {
    it('passes name and new value in callback')

    it('returns a value for every option, even if some options have a null or 0 value')
  })
})
