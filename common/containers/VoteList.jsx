import {connect} from 'react-redux'

import VoteList from '../components/VoteList'

// TODO BEGIN: this is temporary while we mock-up the UI
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}
function mockPlayerIds(howMany = Math.floor(Math.random() * 5) + 1) {
  return Array.from(Array(howMany).keys()).map(() => uuid())
}
function mockGoal() {
  const goalNum = Math.floor(Math.random() * 40) + 5
  return {
    url: `https://github.com/GuildCraftsTesting/web-development-js-testing/issues/${goalNum}`,
    name: `goal #${goalNum}`,
  }
}
function mockVote() {
  return {
    id: uuid(),
    playerIds: mockPlayerIds(),
    goal: mockGoal(),
  }
}
function mockVotes(howMany) {
  return Array.from(Array(howMany).keys()).map(() => mockVote())
}
// TODO END: this is temporary while we mock-up the UI

function mapStateToProps(/* state */) {
  const chapter = {
    id: uuid(),
    name: 'Oakland',
    goalRepositoryURL: 'https://github.com/GuildCraftsTesting/web-development-js-testing',
  }
  const cycle = {
    id: uuid(),
    cycleNumber: 2,
    startTimestamp: new Date(),
    state: 'GOAL_SELECTION',
  }
  const votes = mockVotes(50).sort((voteA, voteB) => voteB.playerIds.length - voteA.playerIds.length)

  return {
    chapter,
    cycle,
    votes,
  }
}

export default connect(mapStateToProps)(VoteList)
