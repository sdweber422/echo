/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import React from 'react'
import {shallow, mount} from 'enzyme'

import CandidateGoal from 'src/common/components/CandidateGoal'
import styles from 'src/common/components/CandidateGoal/index.css'
import factory from 'src/test/factories'

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
      const root = shallow(React.createElement(CandidateGoal, {
        currentUser: await factory.build('user'),
        candidateGoal: this.mockCandidateGoal,
      }))

      expect(root.html()).to.include(this.mockCandidateGoal.goal.title)
    })

    it('renders the number of votes', async function () {
      const root = shallow(React.createElement(CandidateGoal, {
        currentUser: await factory.build('user'),
        candidateGoal: this.mockCandidateGoal,
      }))

      expect(root.html()).to.include(`${this.mockCandidateGoal.playerGoalRanks.length}`)
    })

    it('renders a link to the goal', async function () {
      const root = mount(React.createElement(CandidateGoal, {
        currentUser: await factory.build('user'),
        candidateGoal: this.mockCandidateGoal,
      }))

      const link = root.find('a').first()

      expect(link.props().href || '').to.equal(this.mockCandidateGoal.goal.url)
    })

    it('provides an indication that the current player voted for the given goal', async function () {
      const currentUser = await factory.build('user')
      const goal = {...this.mockCandidateGoal}
      goal.playerGoalRanks[0].playerId = currentUser.id

      const root = shallow(React.createElement(CandidateGoal, {currentUser, candidateGoal: goal}))
      const votedEls = root.findWhere(node => node.hasClass(styles.voted))

      expect(votedEls.length).to.be.above(0)
    })
  })
})
