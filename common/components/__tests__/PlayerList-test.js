import test from 'ava'

import React from 'react'
// import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'

import Dropdown from 'react-toolbox/lib/dropdown'
import TableRow from 'react-toolbox/lib/table/TableRow'

import PlayerList from '../PlayerList'

const mockPlayers = [{
  name: 'Ivanna Lerntokode',
  handle: 'ivannalerntokode',
}]
const mockChapters = [{
  id: 'abcd1234',
  name: 'Over the Rainbow',
}]

test('renders all the players', t => {
  t.plan(1)

  const root = TestUtils.renderIntoDocument(
    React.createElement(PlayerList, {
      showReassignPlayersToChapter: true,
      chapters: mockChapters,
      players: mockPlayers,
    })
  )
  const playerRows = TestUtils.scryRenderedComponentsWithType(root, TableRow)

  t.is(playerRows.length, mockPlayers.length)
})

test('renders actions area if showReassignPlayersToChapter is true', t => {
  t.plan(2)

  const root = TestUtils.renderIntoDocument(
    React.createElement(PlayerList, {
      showReassignPlayersToChapter: true
    })
  )
  const chaptersDropdown = TestUtils.findRenderedComponentWithType(root, Dropdown)
  const saveButton = TestUtils.findRenderedDOMComponentWithTag(root, 'button')

  t.truthy(chaptersDropdown)
  t.truthy(saveButton)
})

test('does not render actions area if showReassignPlayersToChapter is false', t => {
  t.plan(2)

  const root = TestUtils.renderIntoDocument(
    React.createElement(PlayerList, {
      showReassignPlayersToChapter: false
    })
  )

  t.throws(() => TestUtils.findRenderedComponentWithType(root, Dropdown))
  t.throws(() => TestUtils.findRenderedDOMComponentWithTag(root, 'button'))
})

test('renders the chapters into the Dropdown if showReassignPlayersToChapter is true', t => {
  t.plan(1)

  const root = TestUtils.renderIntoDocument(
    React.createElement(PlayerList, {
      showReassignPlayersToChapter: true,
      chapters: mockChapters,
      players: mockPlayers,
    })
  )
  const chaptersDropdown = TestUtils.findRenderedComponentWithType(root, Dropdown)
  const chapterListElements = TestUtils.scryRenderedDOMComponentsWithTag(chaptersDropdown, 'li')

  t.is(chapterListElements.length, mockChapters.length)
})

test('onReassignPlayersToChapter is invoked when button is clicked', t => {
  t.plan(1)

  let clicked = false
  const root = TestUtils.renderIntoDocument(
    React.createElement(PlayerList, {
      showReassignPlayersToChapter: true,
      onReassignPlayersToChapter: () => clicked = true,
      chapters: mockChapters,
      players: mockPlayers,
    })
  )
  // select the first player and the chapter
  root.setState({selectedPlayerRows: [0], selectedChapterId: 'abcd1234'})

  const button = TestUtils.findRenderedDOMComponentWithTag(root, 'button')
  TestUtils.Simulate.click(button)

  t.truthy(clicked)
})
