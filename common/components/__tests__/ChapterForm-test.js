import test from 'ava'

import React from 'react'
// import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'

import ChapterForm from '../ChapterForm'

const fieldsChanged = {
  id: false,
  name: false,
  channelName: false,
  timezone: false,
  cycleDuration: false,
  cycleEpochDate: false,
  cycleEpochTime: false,
}
const mockField = {
  defaultValue: null,
  initialValue: null,
  invalid: false,
}
const changeField = name => {
  return () => {
    fieldsChanged[name] = true
  }
}
const mockFields = {
  id: Object.assign({}, mockField, {name: 'id', onChange: changeField('id')}),
  name: Object.assign({}, mockField, {name: 'name', onChange: changeField('name')}),
  channelName: Object.assign({}, mockField, {name: 'channelName', onChange: changeField('channelName')}),
  timezone: Object.assign({}, mockField, {name: 'timezone', onChange: changeField('timezone')}),
  cycleDuration: Object.assign({}, mockField, {name: 'cycleDuration', onChange: changeField('cycleDuration')}),
  cycleEpochDate: Object.assign({}, mockField, {name: 'cycleEpochDate', onChange: changeField('cycleEpochDate')}),
  cycleEpochTime: Object.assign({}, mockField, {name: 'cycleEpochTime', onChange: changeField('cycleEpochTime')}),
}
const mockAuth = {
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

test('ChapterForm updates fields when they are changed', t => {
  const changesToTest = ['name', 'timezone', 'cycleDuration']
  t.plan(changesToTest.length)

  const props = {
    auth: Object.assign({}, mockAuth),
    fields: Object.assign({}, mockFields),
    errors: {},
  }
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
    t.truthy(fieldsChanged[key])
  })
})

test('ChapterForm submit button is disabled if the form has errors', t => {
  t.plan(1)

  const props = {
    auth: Object.assign({}, mockAuth),
    fields: Object.assign({}, mockFields),
    errors: {name: 'a name error'},
  }
  const root = TestUtils.renderIntoDocument(
    React.createElement(ChapterForm, props)
  )
  const submitButton = TestUtils.scryRenderedDOMComponentsWithTag(root, 'button').filter(button => button.type === 'submit')[0]

  t.truthy(submitButton.disabled)
})

test('ChapterForm submit button is enabled if there are no errors', t => {
  t.plan(1)

  const props = {
    auth: Object.assign({}, mockAuth),
    fields: Object.assign({}, mockFields),
    errors: {},
  }
  const root = TestUtils.renderIntoDocument(
    React.createElement(ChapterForm, props)
  )
  const submitButton = TestUtils.scryRenderedDOMComponentsWithTag(root, 'button').filter(button => button.type === 'submit')[0]

  t.falsy(submitButton.disabled)
})

test('ChapterForm submits form when button is clicked', t => {
  t.plan(1)

  let submitted = false
  const props = {
    auth: Object.assign({}, mockAuth),
    fields: Object.assign({}, mockFields),
    errors: {},
    handleSubmit: () => {
      submitted = true
    },
  }
  const root = TestUtils.renderIntoDocument(
    React.createElement(ChapterForm, props)
  )
  const form = TestUtils.findRenderedDOMComponentWithTag(root, 'form')
  TestUtils.Simulate.submit(form)

  t.truthy(submitted)
})

test.todo('ChapterForm displays progress bar if isBusy')
test.todo('ChapterForm displays not found message if formType is "notfound"')
