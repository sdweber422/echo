/* eslint-env mocha */
/* global testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
// import React from 'react'
// import {shallow} from 'enzyme'

describe(testContext(__filename), function () {
  describe('props.title', function () {
    it('is displayed')
  })

  describe('props.fields', function () {
    describe('props.fields[n].type', function () {
      describe('`TEXT`', function () {
        it('renders a `SurveyFormInputText` element')

        it('passes all expected props to child')
      })

      describe('`RADIO`', function () {
        it('renders a `SurveyFormInputRadio` element')

        it('passes all expected props to child')
      })

      describe('`SLIDER_GROUP`', function () {
        it('renders a `SurveyFormInputSliderGroup` element')

        it('passes all expected props to child')
      })
    })
  })

  describe('props.onSubmit', function () {
    it('is called when the submit button is clicked')
  })

  describe('props.submitLabel', function () {
    it('is displayed on the submit button')
  })

  describe('props.onClose', function () {
    it('is called when the close button is clicked')
  })

  describe('props.closeLabel', function () {
    it('is displayed on the submit button')
  })

  describe('props.disabled', function () {
    it('disables the submit button when true')

    it('disables the close button when true')
  })
})
