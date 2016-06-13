/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import React from 'react'
import {shallow} from 'enzyme'

import CycleVotingResults from '../CycleVotingResults'
import factory from '../../../test/factories'

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
        candidateGoals: [],
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
      const progressBars = root.find('ProgressBar')

      expect(progressBars.length).to.equal(1)
    })

    it('renders the cycle number and chapter name', function () {
      const props = this.getProps()
      const root = shallow(React.createElement(CycleVotingResults, props))

      expect(root.html()).to.contain(`Cycle ${props.cycle.cycleNumber} Candidate Goals (${props.chapter.name})`)
    })

    it('does not render percentage complete unless it is available', function () {
      const root = shallow(React.createElement(CycleVotingResults, this.getProps()))

      expect(root.html()).to.not.match(/%.*have\svoted/)
    })

    it('does not renders voting open / closed status unless it is available', function () {
      const root = shallow(React.createElement(CycleVotingResults, this.getProps()))

      expect(root.html()).to.not.match(/Voting\sis.*(open|closed)/)
    })

    it('renders percentage complete (if it is available)', function () {
      const props = this.getProps({percentageComplete: 72})
      const root = shallow(React.createElement(CycleVotingResults, props))
      const rootHTML = root.html()

      expect(rootHTML).to.contain(props.percentageComplete)
      expect(rootHTML).to.contain('% of active players have voted.')
    })

    it('renders voting open / closed status (if it is available)', function () {
      const props = this.getProps({isVotingStillOpen: true})
      const root = shallow(React.createElement(CycleVotingResults, props))

      expect(root.html()).to.match(/Voting\sis.*open/)
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

    it('renders the correct number of candidate goals', async function () {
      const playerGoalRank = await factory.build('playerGoalRank')
      const candidateGoalProps = this.getProps()
      const candidateGoals = new Array(3).fill({
        playerGoalRanks: [playerGoalRank],
        goal: {
          url: `${candidateGoalProps.chapter.goalRepositoryURL}/issues/40`,
          title: 'goal name (#40)',
        }
      })

      const root = shallow(React.createElement(CycleVotingResults, this.getProps({candidateGoals})))
      const goals = root.find('CandidateGoal')

      expect(goals.length).to.equal(candidateGoals.length)
    })
  })
})
