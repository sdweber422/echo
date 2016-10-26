/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import React from 'react'
import {shallow} from 'enzyme'

import VotingPoolResults from 'src/common/components/VotingPoolResults'
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
        candidateGoals: [],
        isBusy: false,
        onClose: () => null,
      }
      return customProps ? Object.assign({}, baseProps, customProps) : baseProps
    }
  })

  describe('rendering', function () {
    it('displays progress bar if isBusy', function () {
      const root = shallow(React.createElement(VotingPoolResults, this.getProps({isBusy: true})))
      const progressBars = root.find('ThemedProgressBar')

      expect(progressBars.length).to.equal(1)
    })

    it('lets the user know if no one has yet voted', function () {
      const props = this.getProps({cycle: null})
      const root = shallow(React.createElement(VotingPoolResults, props))

      expect(root.html()).to.match(/No\sone.*voted\syet/)
    })

    it('does not render voter ratio unless it is available', function () {
      const root = shallow(React.createElement(VotingPoolResults, this.getProps()))

      expect(root.html()).to.not.match(/have\svoted/)
    })

    it('does not renders voting open / closed status unless it is available', function () {
      const root = shallow(React.createElement(VotingPoolResults, this.getProps()))

      expect(root.html()).to.not.match(/Voting\sis.*(open|closed)/)
    })

    it('renders voter ratio (if it is available)', function () {
      const props = this.getProps({numVoters: 11, numEligiblePlayers: 14})
      const root = shallow(React.createElement(VotingPoolResults, props))
      const rootHTML = root.html()

      expect(rootHTML).to.contain(props.numVoters)
      expect(rootHTML).to.contain(props.numEligiblePlayers)
      expect(rootHTML).to.contain('players have voted')
    })

    it('renders voting open / closed status (if it is available)', function () {
      const props = this.getProps({isVotingStillOpen: true})
      const root = shallow(React.createElement(VotingPoolResults, props))

      expect(root.html()).to.match(/Voting\sis.*open/)
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

      const root = shallow(React.createElement(VotingPoolResults, this.getProps({candidateGoals})))
      const goals = root.find('CandidateGoal')

      expect(goals.length).to.equal(candidateGoals.length)
    })
  })
})
