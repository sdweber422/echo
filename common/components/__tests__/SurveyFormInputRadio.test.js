/* eslint-env mocha */
/* global testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import React from 'react'
import {mount} from 'enzyme'
import {assert} from 'chai'

import SurveyFormInputRadio from '../SurveyFormInputRadio'

describe(testContext(__filename), function () {
  const selectedValue = 100
  const options = [
    {value: 100, label: 'hmkay, #1'},
    {value: 200, label: 'hrmkay, #2'},
  ]

  let changed = false
  const onChange = function (name, value) {
    changed = true
    return {name, value}
  }

  const props = getProps({options, onChange, value: selectedValue})
  const root = mount(<SurveyFormInputRadio {...props}/>)
  const radioButtons = root.find('RadioButton')

  describe('props.options', function () {
    it('renders as many radio buttons as provided options', function () {
      assert.equal(radioButtons.length, options.length)
    })
  })

  describe('props.options[n]', function () {
    it('option.value, option.label', function () {
      options.forEach(function (option, i) {
        const optionButton = radioButtons.at(i)
        const buttonProps = optionButton.props()
        assert.equal(buttonProps.label, option.label)
        assert.equal(buttonProps.value, option.value)
      })
    })
  })

  describe('props.value', function () {
    it('pre-selects the radio button for the option with the value matching the provided value', function () {
      const selectedButton = radioButtons.find({checked: true})
      assert.equal(selectedButton.props().value, selectedValue)
    })
  })

  describe('props.name, props.onChange', function () {
    it('invokes the provided callback, passing name and the value for a selected option', function () {
      const secondButtonInput = radioButtons.at(1).findWhere(node => node.name() === 'input')
      secondButtonInput.simulate('click')
      assert.isTrue(changed)
    })
  })
})

function getProps(props) {
  return Object.assign({}, {
    name: 'radio name',
    options: undefined,
    value: undefined,
    onChange: undefined,
  }, props || {})
}
