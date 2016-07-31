/* eslint-env mocha */
/* global testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import React from 'react'
import {shallow} from 'enzyme'
import {assert} from 'chai'

import SurveyFormInputText from '../SurveyFormInputText'

describe(testContext(__filename), function () {
  let changed = false
  let changedName = null
  let changedValue = null

  const props = {
    name: 'aname',
    hint: 'this is the hint!',
    value: 'hmmkay.',
    onChange: (name, value) => {
      changed = true
      changedName = name
      changedValue = value
    },
  }

  const root = shallow(<SurveyFormInputText {...props}/>)

  describe('props.hint', function () {
    it('renders the hint', function () {
      assert.isTrue(root.html().includes(props.hint))
    })
  })

  describe('props.value', function () {
    it('renders the provided value', function () {
      assert.isTrue(root.html().includes(props.value))
    })
  })

  describe('props.name, props.onChange', function () {
    const textInput = root.find('Input').first()
    const newValue = 'some new text :)'

    textInput.simulate('change', newValue)

    it('passes name and new value in callback', function () {
      assert.isTrue(changed, 'The onChange handler was not called')
      assert.equal(changedName, props.name, 'Name for radio input not passed in onChange callback')
      assert.equal(changedValue, newValue, 'Value for selected radio button not passed in onChange callback')
    })
  })
})
