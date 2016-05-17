/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import React from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'

import CandidateGoal from '../CandidateGoal'
import styles from '../CandidateGoal.css'
import factory from '../../../test/factories'

describe(testContext(__filename), function () {
  before(async function () {
    const goalRankOverwrites = Array.from(Array(3).keys()).map(i => ({goalRank: i}))
    this.mockCandidateGoal = {
      playerGoalRanks: await factory.buildMany('playerGoalRank', goalRankOverwrites, goalRankOverwrites.length),
      goal: {
        url: 'https://github.com/GuildCraftsTesting/web-development-js-testing/issues/40',
        title: 'the goal title (#40)',
      },
    }
  })

  describe('rendering', function () {
    it('renders the goal name', async function () {
      const root = TestUtils.renderIntoDocument(
        React.createElement(CandidateGoal, {
          currentUser: await factory.build('user'),
          candidateGoal: this.mockCandidateGoal,
        })
      )
      const rootNode = ReactDOM.findDOMNode(root)

      expect(rootNode.textContent.indexOf(this.mockCandidateGoal.goal.title)).to.be.at.least(0)
    })

    it('renders the number of votes', async function () {
      const root = TestUtils.renderIntoDocument(
        React.createElement(CandidateGoal, {
          currentUser: await factory.build('user'),
          candidateGoal: this.mockCandidateGoal,
        })
      )
      const rootNode = ReactDOM.findDOMNode(root)

      expect(rootNode.textContent.indexOf(`${this.mockCandidateGoal.playerGoalRanks.length}`)).to.be.at.least(0)
    })

    it('renders a link to the goal', async function () {
      const root = TestUtils.renderIntoDocument(
        React.createElement(CandidateGoal, {
          currentUser: await factory.build('user'),
          candidateGoal: this.mockCandidateGoal,
        })
      )
      const link = TestUtils.findRenderedDOMComponentWithTag(root, 'a')

      expect(link.href).to.equal(this.mockCandidateGoal.goal.url)
    })

    it('provides an indication that the current player voted for the given goal', async function () {
      const currentUser = await factory.build('user')
      const mcg = Object.assign({}, this.mockCandidateGoal)
      mcg.playerGoalRanks[0].playerId = currentUser.id
      const root = TestUtils.renderIntoDocument(
        React.createElement(CandidateGoal, {
          currentUser,
          candidateGoal: mcg,
        })
      )
      const votedEls = TestUtils.scryRenderedDOMComponentsWithClass(root, styles.voted)

      expect(votedEls.length).to.be.above(0)
    })
  })
})
