/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import React from 'react'
import {mount} from 'enzyme'

import PlayerList from 'src/common/components/PlayerList'

describe(testContext(__filename), function () {
  before(function () {
    const users = [{
      id: 'abcd1234',
      name: 'Ivanna Lerntokode',
      handle: 'ivannalerntokode',
    }]
    const chapters = [{
      id: 'wxyz9876',
      name: 'Over the Rainbow',
    }]
    const playersById = {
      abcd1234: {
        id: 'abcd1234',
        chapter: 'wxyz9876',
      },
    }
    this.getProps = customProps => {
      const baseProps = {
        playersById,
        users,
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

      const root = mount(React.createElement(PlayerList, this.getProps({
        showReassignPlayersToChapter: true,
        onReassignPlayersToChapter: () => {
          clicked = true
        },
      })))

      // select the first player and the chapter
      root.setState({selectedPlayerRows: [0], selectedChapterId: 'abcd1234'})

      const button = root.findWhere(node => {
        return node.name() === 'Button'
      }).first()

      button.simulate('click')

      expect(clicked).to.equal(true)
    })
  })

  describe('rendering', function () {
    it('renders all the players', function () {
      const props = this.getProps()
      const root = mount(React.createElement(PlayerList, props))
      const playerRows = root.find('TableRow')

      expect(playerRows.length).to.equal(props.users.length)
    })

    it('renders actions area if showReassignPlayersToChapter is true', function () {
      const root = mount(React.createElement(PlayerList, this.getProps({
        showReassignPlayersToChapter: true
      })))

      const dropdowns = root.find('Dropdown')
      const buttons = root.findWhere(node => {
        return node.name() === 'Button'
      })

      expect(dropdowns.length).to.equal(1)
      expect(buttons.length).to.equal(1)
    })

    it('does not render actions area if showReassignPlayersToChapter is false', function () {
      const root = mount(React.createElement(PlayerList, this.getProps({
        showReassignPlayersToChapter: false
      })))

      const dropdowns = root.find('Dropdown')
      const buttons = root.findWhere(node => {
        return node.name() === 'Button'
      })

      expect(dropdowns.length).to.equal(0)
      expect(buttons.length).to.equal(0)
    })

    it('renders the chapters into the Dropdown if showReassignPlayersToChapter is true', function () {
      const props = this.getProps({showReassignPlayersToChapter: true})
      const root = mount(React.createElement(PlayerList, props))
      const chapterListElements = root.find('Dropdown').children().find('li')

      expect(chapterListElements.length).to.equal(props.chapters.length)
    })
  })
})
