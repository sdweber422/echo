import {connect} from 'react-redux'

import CandidateGoalList from '../components/CandidateGoalList'

// TODO BEGIN: this is temporary while we mock-up the UI
const goalRepositoryURL = 'https://github.com/GuildCraftsTesting/web-development-js-testing'
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}
function mockPlayerGoalRanks(howMany) {
  return Array.from(Array(howMany).keys()).map(() => ({
    playerId: uuid(),
    goalRank: Math.floor(Math.random() * 2),
  }))
}
function mockGoal(goalNum) {
  const nouns = ['HTML', 'CSS', 'JavaScript', 'SQL', 'Twitter clone', 'REST APIs', 'real-time web sockets']
  const verbs = ['learn', 'practice', 'build', 'deep dive on', 'understanding', 'the ins and outs of']
  const title = `${verbs[Math.floor(Math.random() * verbs.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`
  return {
    url: `${goalRepositoryURL}/issues/${goalNum}`,
    title: `${title} (#${goalNum})`,
  }
}
function mockCandidateGoal(i) {
  return {
    goal: mockGoal(i + 1),
    playerGoalRanks: mockPlayerGoalRanks(i % 5 + 1),
  }
}
function mockCandidateGoals(howMany) {
  return Array.from(Array(howMany).keys()).map(i => mockCandidateGoal(i))
}
// TODO END: this is temporary while we mock-up the UI

function mapStateToProps(/* state */) {
  const chapter = {
    id: uuid(),
    name: 'Oakland',
    goalRepositoryURL,
  }
  const cycle = {
    id: uuid(),
    cycleNumber: 2,
    startTimestamp: new Date(),
    state: 'GOAL_SELECTION',
  }
  const candidateGoals = mockCandidateGoals(50).sort((voteA, voteB) => voteB.playerGoalRanks.length - voteA.playerGoalRanks.length)
  const currentUser = {
    id: uuid(),
  }
  // make sure this user voted
  candidateGoals[3].playerGoalRanks[0].playerId = currentUser.id
  candidateGoals[6].playerGoalRanks[0].playerId = currentUser.id

  return {
    currentUser,
    chapter,
    cycle,
    candidateGoals,
    percentageComplete: 72,
    isVotingStillOpen: true,
  }
}

export default connect(mapStateToProps)(CandidateGoalList)
