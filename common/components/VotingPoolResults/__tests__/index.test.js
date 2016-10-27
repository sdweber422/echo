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
    const cycle = await factory.build('cycle')

    const users = await factory.buildMany('user', 3)
    const voterPlayerIds = users.map(user => user.id).slice(0, 2)
    const playerGoalRank = await factory.build('playerGoalRank')
    const candidateGoals = new Array(3).fill({
      playerGoalRanks: [playerGoalRank],
      goal: {
        url: 'https://www.example.com/goals/40',
        title: 'goal name (#40)',
      }
    })

    this.getProps = customProps => {
      const baseProps = {
        currentUser,
        cycle,
        pool: {
          name: 'Turquoise',
          candidateGoals,
          users,
          voterPlayerIds,
          isVotingStillOpen: true,
        },
        isBusy: false,
        isCollapsed: false,
        onClose: () => null,
      }
      return customProps ? Object.assign({}, baseProps, customProps) : baseProps
    }
  })

  describe('rendering', function () {
    it('displays the pool name', function () {
      const props = this.getProps()
      const root = shallow(React.createElement(VotingPoolResults, props))

      expect(root.html()).to.contain(props.pool.name)
    })

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
      const props = this.getProps()
      props.pool.users = []
      props.pool.voterPlayerIds = []
      const root = shallow(React.createElement(VotingPoolResults, props))

      expect(root.html()).to.not.match(/have\svoted/)
    })

    it('does not renders voting open / closed status unless it is available', function () {
      const props = this.getProps()
      delete props.pool.isVotingStillOpen
      const root = shallow(React.createElement(VotingPoolResults, props))

      expect(root.html()).to.not.match(/Voting\sis.*(open|closed)/)
    })

    it('renders voter ratio (if it is available)', function () {
      const props = this.getProps()
      const root = shallow(React.createElement(VotingPoolResults, props))
      const rootHTML = root.html()

      expect(rootHTML).to.contain(props.pool.numVoters)
      expect(rootHTML).to.contain(props.pool.numEligiblePlayers)
      expect(rootHTML).to.contain('players have voted')
    })

    it('renders voting open / closed status (if it is available)', function () {
      const props = this.getProps()
      const root = shallow(React.createElement(VotingPoolResults, props))

      expect(root.html()).to.match(/Voting\sis.*open/)
    })

    describe('when collapsed', function () {
      it('does not render any candidate goals', function () {
        const root = shallow(React.createElement(VotingPoolResults, this.getProps({isCollapsed: true})))
        const goals = root.find('CandidateGoal')

        expect(goals.length).to.equal(0)
      })
    })

    describe('when not collapsed', function () {
      it('renders the correct number of candidate goals', function () {
        const props = this.getProps()
        const root = shallow(React.createElement(VotingPoolResults, props))
        const goals = root.find('CandidateGoal')

        expect(goals.length).to.equal(props.pool.candidateGoals.length)
      })
    })
  })
})
