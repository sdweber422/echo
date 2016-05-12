/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import React from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'

import ProgressBar from 'react-toolbox/lib/progress_bar'

import ChapterForm from '../ChapterForm'

describe(testContext(__filename), function () {
  before(function () {
    const mockField = {
      defaultValue: null,
      initialValue: null,
      invalid: false,
    }

    const changeField = name => {
      return () => {
        this.fieldsChanged[name] = true
      }
    }

    this.fieldsChanged = {
      id: false,
      name: false,
      channelName: false,
      timezone: false,
      cycleDuration: false,
      cycleEpochDate: false,
      cycleEpochTime: false,
    }

    this.mockFields = {
      id: Object.assign({}, mockField, {name: 'id', onChange: changeField('id')}),
      name: Object.assign({}, mockField, {name: 'name', onChange: changeField('name')}),
      channelName: Object.assign({}, mockField, {name: 'channelName', onChange: changeField('channelName')}),
      timezone: Object.assign({}, mockField, {name: 'timezone', onChange: changeField('timezone')}),
      cycleDuration: Object.assign({}, mockField, {name: 'cycleDuration', onChange: changeField('cycleDuration')}),
      cycleEpochDate: Object.assign({}, mockField, {name: 'cycleEpochDate', onChange: changeField('cycleEpochDate')}),
      cycleEpochTime: Object.assign({}, mockField, {name: 'cycleEpochTime', onChange: changeField('cycleEpochTime')}),
    }

    this.mockAuth = {
      currentUser: {
        id: 'abcd1234',
        email: 'me@example.com',
        emails: ['me@example.com', 'me2@example.com'],
        handle: 'me',
        name: 'Me',
        phone: null,
        dateOfBirth: null,
        timezone: null,
      },
      isBusy: false,
    }

    this.getProps = customProps => {
      const baseProps = {
        handleSubmit: () => null,
        submitting: false,
        isBusy: false,
        formType: 'update',
        showCreateInviteCode: false,
        onCreateInviteCode: () => null,
        auth: Object.assign({}, this.mockAuth),
        fields: Object.assign({}, this.mockFields),
        errors: {},
      }
      return customProps ? Object.assign({}, baseProps, customProps) : baseProps
    }
  })

  describe('interactions', function () {
    it('updates fields when they are changed', function () {
      const changesToTest = ['name', 'timezone', 'cycleDuration']

      const props = this.getProps()
      const root = TestUtils.renderIntoDocument(
        React.createElement(ChapterForm, props)
      )
      const inputs = TestUtils.scryRenderedDOMComponentsWithTag(root, 'input')
      inputs.forEach(input => {
        if (changesToTest.indexOf(input.name) >= 0) {
          TestUtils.Simulate.change(input)
        }
      })

      changesToTest.forEach(key => {
        expect(this.fieldsChanged[key]).to.be.ok
      })
    })

    it('submit button is disabled if the form has errors', function () {
      const props = this.getProps({
        errors: {name: 'a name error'},
      })
      const root = TestUtils.renderIntoDocument(
        React.createElement(ChapterForm, props)
      )
      const submitButton = TestUtils.scryRenderedDOMComponentsWithTag(root, 'button').filter(button => button.type === 'submit')[0]

      expect(submitButton.disabled).to.be.ok
    })

    it('submit button is enabled if there are no errors', function () {
      const props = this.getProps()
      const root = TestUtils.renderIntoDocument(
        React.createElement(ChapterForm, props)
      )
      const submitButton = TestUtils.scryRenderedDOMComponentsWithTag(root, 'button').filter(button => button.type === 'submit')[0]

      expect(submitButton.disabled).to.not.be.ok
    })

    it('submits form when button is clicked', function () {
      let submitted = false
      const props = this.getProps({
        handleSubmit: () => {
          submitted = true
        },
      })
      const root = TestUtils.renderIntoDocument(
        React.createElement(ChapterForm, props)
      )
      const form = TestUtils.findRenderedDOMComponentWithTag(root, 'form')
      TestUtils.Simulate.submit(form)

      expect(submitted).to.be.ok
    })
  })

  describe('rendering', function () {
    it('displays progress bar if isBusy', function () {
      const props = this.getProps({isBusy: true})
      const root = TestUtils.renderIntoDocument(
        React.createElement(ChapterForm, props)
      )
      const progressBar = TestUtils.findRenderedComponentWithType(root, ProgressBar)

      expect(progressBar).to.be.ok
    })

    it('displays not found message if formType is "notfound"', function () {
      const props = this.getProps({formType: 'notfound'})
      const root = TestUtils.renderIntoDocument(
        React.createElement(ChapterForm, props)
      )
      const rootNode = ReactDOM.findDOMNode(root)

      expect(rootNode.textContent).to.match(/not found/i)
    })
  })
})
