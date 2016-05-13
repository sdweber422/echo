/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import React from 'react'
// import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'

import Dropdown from 'react-toolbox/lib/dropdown'
import TableRow from 'react-toolbox/lib/table/TableRow'

import PlayerList from '../PlayerList'

describe(testContext(__filename), function () {
  before(function () {
    const players = [{
      name: 'Ivanna Lerntokode',
      handle: 'ivannalerntokode',
    }]
    const chapters = [{
      id: 'abcd1234',
      name: 'Over the Rainbow',
    }]
    this.getProps = customProps => {
      const baseProps = {
        players,
        chapters,
        onReassignPlayersToChapter: () => null,
        showReassignPlayersToChapter: false,
      }
      return customProps ? Object.assign({}, baseProps, customProps) : baseProps
    }
  })

  describe('interactions', function () {
    it('onReassignPlayersToChapter is invoked when button is clicked', function () {
      let clicked = false
      const root = TestUtils.renderIntoDocument(
        React.createElement(PlayerList, this.getProps({
          showReassignPlayersToChapter: true,
          onReassignPlayersToChapter: () => clicked = true,
        }))
      )
      // select the first player and the chapter
      root.setState({selectedPlayerRows: [0], selectedChapterId: 'abcd1234'})

      const button = TestUtils.findRenderedDOMComponentWithTag(root, 'button')
      TestUtils.Simulate.click(button)

      expect(clicked).to.be.ok
    })
  })

  describe('rendering', function () {
    it('renders all the players', function () {
      const props = this.getProps()
      const root = TestUtils.renderIntoDocument(
        React.createElement(PlayerList, props)
      )
      const playerRows = TestUtils.scryRenderedComponentsWithType(root, TableRow)

      expect(playerRows.length).to.equal(props.players.length)
    })

    it('renders actions area if showReassignPlayersToChapter is true', function () {
      const root = TestUtils.renderIntoDocument(
        React.createElement(PlayerList, this.getProps({
          showReassignPlayersToChapter: true
        }))
      )
      const chaptersDropdown = TestUtils.findRenderedComponentWithType(root, Dropdown)
      const saveButton = TestUtils.findRenderedDOMComponentWithTag(root, 'button')

      expect(chaptersDropdown).to.be.ok
      expect(saveButton).to.be.ok
    })

    it('does not render actions area if showReassignPlayersToChapter is false', function () {
      const root = TestUtils.renderIntoDocument(
        React.createElement(PlayerList, this.getProps({
          showReassignPlayersToChapter: false
        }))
      )

      expect(() => TestUtils.findRenderedComponentWithType(root, Dropdown)).to.throw()
      expect(() => TestUtils.findRenderedDOMComponentWithTag(root, 'button')).to.throw()
    })

    it('renders the chapters into the Dropdown if showReassignPlayersToChapter is true', function () {
      const props = this.getProps({showReassignPlayersToChapter: true})
      const root = TestUtils.renderIntoDocument(
        React.createElement(PlayerList, props)
      )
      const chaptersDropdown = TestUtils.findRenderedComponentWithType(root, Dropdown)
      const chapterListElements = TestUtils.scryRenderedDOMComponentsWithTag(chaptersDropdown, 'li')

      expect(chapterListElements.length).to.equal(props.chapters.length)
    })
  })
})
