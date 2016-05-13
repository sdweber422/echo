/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import React from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'

import ProgressBar from 'react-toolbox/lib/progress_bar'

import CycleVotingResults from '../CycleVotingResults'
import CandidateGoal from '../CandidateGoal'
import factory from '../../../test/factories'

describe(testContext(__filename), function () {
  before(async function () {
    const currentUser = await factory.build('player')
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
      const root = TestUtils.renderIntoDocument(
        React.createElement(CycleVotingResults, this.getProps({
          onClose: () => (clicked = true)
        }))
      )
      const links = TestUtils.scryRenderedDOMComponentsWithTag(root, 'a')
      const closeLink = links[1]
      TestUtils.Simulate.click(closeLink)

      expect(clicked).to.be.ok
    })
  })

  describe('rendering', function () {
    it('displays progress bar if isBusy', function () {
      const root = TestUtils.renderIntoDocument(
        React.createElement(CycleVotingResults, this.getProps({isBusy: true}))
      )
      const progressBar = TestUtils.findRenderedComponentWithType(root, ProgressBar)

      expect(progressBar).to.be.ok
    })

    it('renders the cycle number and chapter name', function () {
      const props = this.getProps()
      const root = TestUtils.renderIntoDocument(
        React.createElement(CycleVotingResults, this.getProps())
      )
      const rootNode = ReactDOM.findDOMNode(root)

      expect(rootNode.textContent).to.contain(props.chapter.name)
      expect(rootNode.textContent).to.contain(props.cycle.cycleNumber)
    })

    it('does not render percentage complete unless it is available', function () {
      const root = TestUtils.renderIntoDocument(
        React.createElement(CycleVotingResults, this.getProps())
      )
      const rootNode = ReactDOM.findDOMNode(root)

      expect(rootNode.textContent).to.not.match(/\%.*have\svoted/)
    })

    it('does not renders voting open / closed status unless it is available', function () {
      const root = TestUtils.renderIntoDocument(
        React.createElement(CycleVotingResults, this.getProps())
      )
      const rootNode = ReactDOM.findDOMNode(root)

      expect(rootNode.textContent).to.not.match(/Voting\sis.*(open|closed)/)
    })

    it('renders percentage complete (if it is available)', function () {
      const props = this.getProps({percentageComplete: 72})
      const root = TestUtils.renderIntoDocument(
        React.createElement(CycleVotingResults, props)
      )
      const rootNode = ReactDOM.findDOMNode(root)

      expect(rootNode.textContent).to.contain(`${props.percentageComplete}`)
      expect(rootNode.textContent).to.match(/\%.*have\svoted/)
    })

    it('renders voting open / closed status (if it is available)', function () {
      const props = this.getProps({isVotingStillOpen: true})
      const root = TestUtils.renderIntoDocument(
        React.createElement(CycleVotingResults, props)
      )
      const rootNode = ReactDOM.findDOMNode(root)

      expect(rootNode.textContent).to.match(/Voting\sis.*open/)
    })

    it('renders a link to the goal library', function () {
      const props = this.getProps()
      const root = TestUtils.renderIntoDocument(
        React.createElement(CycleVotingResults, props)
      )
      const links = TestUtils.scryRenderedDOMComponentsWithTag(root, 'a')
      const goalRepoLink = links.filter(link => link.href === props.chapter.goalRepositoryURL)[0]

      expect(goalRepoLink.href).to.equal(props.chapter.goalRepositoryURL)
    })

    it('renders the correct number of candidate goals', async function () {
      const playerGoalRank = await factory.build('playerGoalRank')
      let props = this.getProps()
      const candidateGoals = Array.from(Array(3).keys()).map(() => {
        return {
          playerGoalRanks: [playerGoalRank],
          goal: {
            url: `${props.chapter.goalRepositoryURL}/issues/40`,
            title: 'goal name (#40)',
          }
        }
      })
      props = this.getProps({candidateGoals})
      const root = TestUtils.renderIntoDocument(
        React.createElement(CycleVotingResults, props)
      )
      const cgs = TestUtils.scryRenderedComponentsWithType(root, CandidateGoal)

      expect(cgs.length).to.equal(candidateGoals.length)
    })
  })
})
