/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import React from 'react'
import {shallow, mount} from 'enzyme'

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

      const props = this.getProps({
        showCreateButton: true,
        onCreateChapter: () => {
          clicked = true
        },
      })

      const root = mount(React.createElement(ChapterList, props))
      const button = root.findWhere(node => {
        return node.name() === 'Button'
      }).first()

      button.simulate('click')

      expect(clicked).to.equal(true)
    })

    it('onEditChapter is invoked when row is selected', function () {
      let clicked = false

      const props = this.getProps({
        selectable: true,
        onEditChapter: () => {
          clicked = true
        },
      })

      const root = mount(React.createElement(ChapterList, props))

      root.find('Table')
        .children()
        .find('input')
        .first()
        .simulate('click')

      expect(clicked).to.equal(true)
    })
  })

  describe('rendering', function () {
    it('renders create button if showCreateButton is true', function () {
      const root = mount(React.createElement(ChapterList, this.getProps({showCreateButton: true})))
      const buttons = root.findWhere(node => {
        return node.name() === 'Button'
      })

      expect(buttons.length).to.equal(1)
    })

    it('does not render create button if showCreateButton is false', function () {
      const root = mount(React.createElement(ChapterList, this.getProps({showCreateButton: false})))
      const buttons = root.findWhere(node => {
        return node.name() === 'Button'
      })

      expect(buttons.length).to.equal(0)
    })

    it('renders "no chapters" message if there are no chapters.', function () {
      const root = shallow(React.createElement(ChapterList, this.getProps({chapters: []})))

      expect(root.html()).to.match(/no chapters/i)
    })

    it('is selectable if selectable is true', function () {
      const props = this.getProps({selectable: true})
      const root = mount(React.createElement(ChapterList, props))
      const checkboxes = root.find('Checkbox')

      expect(checkboxes.length).to.be.at.least(props.chapters.length)
    })

    it('is not selectable if selectable is false', function () {
      const props = this.getProps({selectable: false})
      const root = shallow(React.createElement(ChapterList, props))
      const checkboxes = root.find('Checkbox')

      expect(checkboxes.length).to.equal(0)
    })
  })
})
