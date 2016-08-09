/* eslint-env mocha */
/* global testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import React from 'react'
import {shallow, mount} from 'enzyme'
import {assert} from 'chai'

import SurveyForm from '../SurveyForm'

describe(testContext(__filename), function () {
  describe('props.title', function () {
    it('title is rendered', function () {
      const props = getProps({title: 'look at mah title'})
      const root = shallow(<SurveyForm {...props}/>)
      assert.isTrue(root.html().includes(props.title))
    })
  })

  describe('props.fields[n].type: TEXT', function () {
    const radioField = getField('TEXT')
    const props = getProps({fields: [radioField]})
    const root = mount(<SurveyForm {...props}/>)
    const textInput = root.find('SurveyFormInputText')

    it('renders a <SurveyFormInputText> element', function () {
      assert.equal(textInput.length, 1)
    })

    it('passes all expected props to <SurveyFormInputText>', function () {
      const originalProps = props.fields[0]
      const passedProps = textInput.props()
      const expectedProps = ['name', 'hint', 'value']

      _checkProps(originalProps, passedProps, expectedProps)
    })
  })

  describe('props.fields[n].type: RADIO', function () {
    const textField = getField('RADIO')
    const props = getProps({fields: [textField]})
    const root = mount(<SurveyForm {...props}/>)
    const radioInput = root.find('SurveyFormInputRadio')

    it('renders a <SurveyFormInputRadio> element', function () {
      assert.equal(radioInput.length, 1)
    })

    it('passes all expected props to <SurveyFormInputRadio>', function () {
      const originalProps = props.fields[0]
      const passedProps = radioInput.props()
      const expectedProps = ['name', 'options', 'value']

      _checkProps(originalProps, passedProps, expectedProps)
    })
  })

  describe('props.fields[n].type: NUMERIC', function () {
    const textField = getField('NUMERIC')
    const props = getProps({fields: [textField]})
    const root = mount(<SurveyForm {...props}/>)
    const numericInput = root.find('SurveyFormInputNumeric')

    it('renders a <SurveyFormInputNumeric> element', function () {
      assert.equal(numericInput.length, 1)
    })

    it('passes all expected props to <SurveyFormInputNumeric>', function () {
      const originalProps = props.fields[0]
      const passedProps = numericInput.props()
      const expectedProps = ['name', 'hint', 'value']

      _checkProps(originalProps, passedProps, expectedProps)
    })
  })

  describe('props.fields[n].type: SLIDER_GROUP', function () {
    const sliderGroupField = getField('SLIDER_GROUP')
    const props = getProps({fields: [sliderGroupField]})
    const root = mount(<SurveyForm {...props}/>)
    const sliderGroupInput = root.find('SurveyFormInputSliderGroup')

    it('renders a <SurveyFormInputSliderGroup> element', function () {
      assert.equal(sliderGroupInput.length, 1)
    })

    it('passes all expected props to <SurveyFormInputSliderGroup>', function () {
      const originalProps = props.fields[0]
      const passedProps = sliderGroupInput.props()
      const expectedProps = ['name', 'hint', 'sum', 'options', 'value']

      _checkProps(originalProps, passedProps, expectedProps)
    })
  })

  describe('props.submitLabel', function () {
    it('is displayed', function () {
      const props = getProps({submitLabel: 'Submit This Thang'})
      const root = shallow(<SurveyForm {...props}/>)
      assert.isTrue(root.html().includes(props.submitLabel))
    })
  })

  describe('props.onSubmit', function () {
    it('is called when the submit button is clicked', function () {
      let submitted = false
      const onSubmit = () => {
        submitted = true
      }

      const props = getProps({onSubmit})
      const root = mount(<SurveyForm {...props}/>)
      const submitButton = findSubmitButton(root)

      submitButton.simulate('click')

      assert.isTrue(submitted)
    })
  })

  describe('props.disabled', function () {
    it('disables the submit button when true', function () {
      const props = getProps({disabled: true})
      const root = mount(<SurveyForm {...props}/>)
      const submitButton = findSubmitButton(root)

      assert.isTrue(submitButton.props().disabled)
    })
  })
})

function getProps(props) {
  return Object.assign({}, {
    title: undefined,
    fields: undefined,
    onSubmit: undefined,
    submitLabel: undefined,
    onClose: undefined,
    closeLabel: undefined,
    disabled: undefined,
  }, props || {})
}

function getField(type) {
  switch (type) {
    case 'TEXT':
      return {
        type: 'TEXT',
        name: 'text name',
        hint: 'text hint',
        value: 'text value',
      }
    case 'NUMERIC':
      return {
        type: 'NUMERIC',
        name: 'text name',
        hint: 'text hint',
        value: 99,
      }
    case 'RADIO':
      return {
        type: 'RADIO',
        name: 'radio name',
        options: [],
        value: 50,
      }
    case 'SLIDER_GROUP':
      return {
        type: 'SLIDER_GROUP',
        name: 'slidergrp name',
        hint: 'slidergrp hint',
        sum: 100,
        options: [],
        value: [],
      }
    default:
      return null
  }
}

function findSubmitButton(wrapper) {
  return wrapper.findWhere(node => {
    return node.name() === 'Button' && node.props().type === 'submit'
  }).first()
}

function _checkProps(originalProps, passedProps, expectedProps) {
  expectedProps.forEach(expectedProp => {
    assert.isTrue(typeof originalProps[expectedProp] !== 'undefined', `Invalid assertion for prop ${expectedProp}`)
    assert.isTrue(passedProps[expectedProp] === originalProps[expectedProp], `Did not pass prop ${expectedProp}`)
  })
}
