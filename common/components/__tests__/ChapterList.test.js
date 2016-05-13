/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import React from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'

import Checkbox from 'react-toolbox/lib/checkbox'

import factory from '../../../test/factories'
import ChapterList from '../ChapterList'

describe(testContext(__filename), function () {
  before(async function () {
    const chapters = await factory.buildMany('chapter', 3)
    this.getProps = customProps => {
      const baseProps = {
        chapters,
        selectable: false,
        onEditChapter: () => null,
        onCreateChapter: () => null,
        showCreateButton: false,
      }
      return customProps ? Object.assign({}, baseProps, customProps) : baseProps
    }
  })

  describe('interactions', function () {
    it('onCreateChapter is invoked when button is clicked', function () {
      let clicked = false
      const root = TestUtils.renderIntoDocument(
        React.createElement(ChapterList, this.getProps({
          showCreateButton: true,
          onCreateChapter: () => clicked = true,
        }))
      )

      const button = TestUtils.findRenderedDOMComponentWithTag(root, 'button')
      TestUtils.Simulate.click(button)

      expect(clicked).to.be.ok
    })

    it('onEditChapter is invoked when row is selected', function () {
      let clicked = false
      const root = TestUtils.renderIntoDocument(
        React.createElement(ChapterList, this.getProps({
          selectable: true,
          onEditChapter: () => clicked = true,
        }))
      )
      const checkboxes = TestUtils.scryRenderedComponentsWithType(root, Checkbox)
      const input = TestUtils.findRenderedDOMComponentWithTag(checkboxes[0], 'input')
      TestUtils.Simulate.click(input)

      expect(clicked).to.be.ok
    })
  })

  describe('rendering', function () {
    it('renders create button if showCreateButton is true', function () {
      const root = TestUtils.renderIntoDocument(
        React.createElement(ChapterList, this.getProps({showCreateButton: true}))
      )
      const buttons = TestUtils.scryRenderedDOMComponentsWithTag(root, 'button')

      expect(buttons.length).to.equal(1)
    })

    it('does not render create button if showCreateButton is false', function () {
      const root = TestUtils.renderIntoDocument(
        React.createElement(ChapterList, this.getProps({showCreateButton: false}))
      )
      const buttons = TestUtils.scryRenderedDOMComponentsWithTag(root, 'button')

      expect(buttons.length).to.equal(0)
    })

    it('renders "no chapters" message if there are no chapters.', function () {
      const root = TestUtils.renderIntoDocument(
        React.createElement(ChapterList, this.getProps({chapters: []}))
      )
      const rootNode = ReactDOM.findDOMNode(root)

      expect(rootNode.textContent).to.match(/no chapters/i)
    })

    it('is selectable if selectable is true', function () {
      const props = this.getProps({selectable: true})
      const root = TestUtils.renderIntoDocument(
        React.createElement(ChapterList, props)
      )
      const checkboxes = TestUtils.scryRenderedComponentsWithType(root, Checkbox)

      expect(checkboxes.length).to.be.at.least(props.chapters.length)
    })

    it('is not selectable if selectable is false', function () {
      const props = this.getProps({selectable: false})
      const root = TestUtils.renderIntoDocument(
        React.createElement(ChapterList, props)
      )
      const checkboxes = TestUtils.scryRenderedComponentsWithType(root, Checkbox)

      expect(checkboxes.length).to.equal(0)
    })
  })
})
