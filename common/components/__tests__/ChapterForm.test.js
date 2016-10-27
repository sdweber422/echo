/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import React from 'react'
import {shallow, mount} from 'enzyme'

import ChapterForm from 'src/common/components/ChapterForm'

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
      goalRepositoryURL: false,
      cycleDuration: false,
      cycleEpochDate: false,
      cycleEpochTime: false,
    }

    this.mockFields = {
      id: Object.assign({}, mockField, {name: 'id', onChange: changeField('id')}),
      name: Object.assign({}, mockField, {name: 'name', onChange: changeField('name')}),
      channelName: Object.assign({}, mockField, {name: 'channelName', onChange: changeField('channelName')}),
      timezone: Object.assign({}, mockField, {name: 'timezone', onChange: changeField('timezone')}),
      goalRepositoryURL: Object.assign({}, mockField, {name: 'timezone', onChange: changeField('goalRepositoryURL')}),
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
      const changesToTest = {
        id: true,
        name: true,
        channelName: true,
        cycleDuration: true
      }

      const props = this.getProps()
      const root = shallow(React.createElement(ChapterForm, props))
      const inputs = root.find('ThemedInput')

      inputs.forEach(input => {
        if (changesToTest[input.props().name]) {
          input.simulate('change')
        }
      })

      Object.keys(changesToTest).forEach(fieldName => {
        expect(this.fieldsChanged[fieldName]).to.equal(true)
      })
    })

    it('submit button is disabled if the form has errors', function () {
      const props = this.getProps({
        errors: {name: 'a name error'},
      })

      const root = mount(React.createElement(ChapterForm, props))
      const submitButton = root.findWhere(node => {
        return node.name() === 'Button' && node.props().type === 'submit'
      }).first()

      expect(submitButton.props().disabled).to.equal(true)
    })

    it('submit button is enabled if there are no errors', function () {
      const root = mount(React.createElement(ChapterForm, this.getProps()))
      const submitButton = root.findWhere(node => {
        return node.name() === 'Button' && node.props().type === 'submit'
      }).first()

      expect(submitButton.props().disabled).to.equal(false)
    })

    it('handles form submission', function () {
      let submitted = false
      const props = this.getProps({
        handleSubmit: () => {
          submitted = true
        },
      })

      const root = shallow(React.createElement(ChapterForm, props))
      root.find('form').simulate('submit')

      expect(submitted).to.equal(true)
    })
  })

  describe('rendering', function () {
    it('displays progress bar if isBusy', function () {
      const props = this.getProps({isBusy: true})
      const root = shallow(React.createElement(ChapterForm, props))
      const progressBars = root.find('ThemedProgressBar')

      expect(progressBars.length).to.equal(1)
    })

    it('displays not found message if formType is "notfound"', function () {
      const props = this.getProps({formType: 'notfound'})
      const root = shallow(React.createElement(ChapterForm, props))

      expect(root.html()).to.match(/not found/i)
    })
  })
})
