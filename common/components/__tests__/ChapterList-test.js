import test from 'ava'

import React from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'

import ChapterList from '../ChapterList'

test('renders create button if showCreateButton is true', t => {
  t.plan(1)

  const root = TestUtils.renderIntoDocument(
    React.createElement(ChapterList, {showCreateButton: true})
  )
  const buttons = TestUtils.scryRenderedDOMComponentsWithTag(root, 'button')

  t.is(buttons.length, 1)
})

test('does not render create button if showCreateButton is false', t => {
  t.plan(1)

  const root = TestUtils.renderIntoDocument(
    React.createElement(ChapterList, {showCreateButton: false})
  )
  const buttons = TestUtils.scryRenderedDOMComponentsWithTag(root, 'button')

  t.is(buttons.length, 0)
})

test.todo('is selectable if selectable is true')
test.todo('is not selectable if selectable is false')

test('renders "no chapters" message if there are no chapters.', t => {
  t.plan(1)

  const root = TestUtils.renderIntoDocument(
    React.createElement(ChapterList, {chapters: []})
  )
  const rootNode = ReactDOM.findDOMNode(root)

  t.regex(rootNode.textContent, /no chapters/i)
})

test('onCreateChapter is invoked when button is clicked', t => {
  t.plan(1)

  let clicked = false
  const root = TestUtils.renderIntoDocument(
    React.createElement(ChapterList, {
      showCreateButton: true,
      onCreateChapter: () => clicked = true,
    })
  )

  const button = TestUtils.findRenderedDOMComponentWithTag(root, 'button')
  TestUtils.Simulate.click(button)

  t.truthy(clicked)
})

test.todo('onEditChapter is invoked when row is selected')
