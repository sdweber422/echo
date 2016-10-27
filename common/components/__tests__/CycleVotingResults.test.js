/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import React from 'react'
import {shallow} from 'enzyme'

import CycleVotingResults from 'src/common/components/CycleVotingResults'
import factory from 'src/test/factories'

describe(testContext(__filename), function () {
  before(async function () {
    const currentUser = await factory.build('user')
    const chapter = await factory.build('chapter')
    const cycle = await factory.build('cycle')
    this.getProps = customProps => {
      const baseProps = {
        currentUser,
        chapter,
        cycle,
        pools: [{
          name: 'Turquoise',
          candidateGoals: [],
          usersInPool: [],
          voterPlayerIds: [],
          isVotingStillOpen: true,
        }],
        isBusy: false,
        onClose: () => null,
      }
      return customProps ? Object.assign({}, baseProps, customProps) : baseProps
    }
  })

  describe('interactions', function () {
    it('clicking the close link calls onClose', function () {
      let clicked = false

      const root = shallow(React.createElement(CycleVotingResults, this.getProps({
        onClose: () => {
          clicked = true
        }
      })))

      const closeLink = root.findWhere(el => {
        return el.name() === 'a' &&
          el.html().includes('Close Voting Results')
      }).first()

      closeLink.simulate('click')

      expect(clicked).to.equal(true)
    })
  })

  describe('rendering', function () {
    it('displays progress bar if isBusy', function () {
      const root = shallow(React.createElement(CycleVotingResults, this.getProps({isBusy: true})))
      const progressBars = root.find('ThemedProgressBar')

      expect(progressBars.length).to.equal(1)
    })

    it('lets the user know there are no results when that is the case', function () {
      const props = this.getProps({cycle: null})
      const root = shallow(React.createElement(CycleVotingResults, props))

      expect(root.html()).to.contain('no voting results to display')
    })

    it('renders the cycle number and chapter name', function () {
      const props = this.getProps()
      const root = shallow(React.createElement(CycleVotingResults, props))

      expect(root.html()).to.contain(`Cycle ${props.cycle.cycleNumber} Candidate Goals (${props.chapter.name})`)
    })

    it('renders a link to the goal library', function () {
      const props = this.getProps()
      const root = shallow(React.createElement(CycleVotingResults, props))
      const goalRepoLinks = root.findWhere(node => {
        return node.name() === 'a' &&
          (node.props().href || '').startsWith(props.chapter.goalRepositoryURL)
      })

      expect(goalRepoLinks.length).to.equal(1)
    })

    it('renders the correct number of pools')
  })
})
