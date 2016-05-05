import {connect} from 'react-redux'

import VoteList from '../components/VoteList'

function mapStateToProps(state) {
  const {auth: {currentUser}} = state

  const chapter = {
    id: '2155c6c4-16c6-4def-9d09-46002cf00e9e',
    name: 'Oakland',
    goalRepositoryURL: 'https://github.com/GuildCraftsTesting/web-development-js-testing',
  }
  const cycle = {
    id: '3155c6c4-16c6-4def-9d09-46002cf00e9e',
    cycleNumber: 2,
    startTimestamp: new Date(),
    state: 'GOAL_SELECTION',
  }
  const votes = [{
    id: '4155c6c4-16c6-4def-9d09-46002cf00e9e',
    playerIds: [
      '4155c6c4-16c6-4def-9d09-46002cf01e9e',
      '4155c6c4-16c6-4def-9d09-46002cf02e9e',
      '4155c6c4-16c6-4def-9d09-46002cf03e9e',
      '4155c6c4-16c6-4def-9d09-46002cf04e9e',
      '4155c6c4-16c6-4def-9d09-46002cf05e9e',
    ],
    goal: {
      url: 'https://github.com/GuildCraftsTesting/web-development-js-testing/issues/45',
      name: 'rerum placeat accusantium',
    },
  }, {
    id: '5155c6c4-16c6-4def-9d09-46002cf00e9e',
    playerIds: [
      '4155c6c4-16c6-4def-9d09-46002cf31e9e',
      '4155c6c4-16c6-4def-9d09-46002cf32e9e',
      '4155c6c4-16c6-4def-9d09-46002cf33e9e',
    ],
    goal: {
      url: 'https://github.com/GuildCraftsTesting/web-development-js-testing/issues/46',
      name: 'et blanditiis illum',
    },
  }, {
    id: '6155c6c4-16c6-4def-9d09-46002cf00e9e',
    playerIds: [
      '4155c6c4-16c6-4def-9d09-46002cf11e9e',
      '4155c6c4-16c6-4def-9d09-46002cf12e9e',
    ],
    goal: {
      url: 'https://github.com/GuildCraftsTesting/web-development-js-testing/issues/47',
      name: 'ratione eum ipsum',
    },
  }, {
    id: '7155c6c4-16c6-4def-9d09-46002cf00e9e',
    playerIds: [
      '4155c6c4-16c6-4def-9d09-46002cf21e9e',
    ],
    goal: {
      url: 'https://github.com/GuildCraftsTesting/web-development-js-testing/issues/48',
      name: 'repudiandae labore et',
    },
  }]

  return {
    chapter,
    cycle,
    votes,
  }
}

export default connect(mapStateToProps)(VoteList)
