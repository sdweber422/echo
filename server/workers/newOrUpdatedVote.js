import {graphql} from 'graphql'

import {connect} from 'src/db'
import {processJobs} from 'src/server/util/queue'
import {getSocket} from 'src/server/util/socket'
import {getCycleById} from 'src/server/db/cycle'
import fetchGoalInfo from 'src/server/actions/fetchGoalInfo'
import getCycleVotingResults from 'src/server/actions/getCycleVotingResults'
import rootSchema from 'src/server/graphql/rootSchema'

const PREFIX_NOTIFY_USER = 'notifyUser-'
const PREFIX_CYCLE_NOTING_RESULTS = 'cycleVotingResults-'

const r = connect()

export function start() {
  processJobs('newOrUpdatedVote', processVote)
}

async function processVote(vote) {
  const goals = await fetchGoalsInfo(vote)
  const validatedVote = Object.assign({}, vote, {
    pendingValidation: false,
    notYetValidatedGoalDescriptors: null,
  })
  if (validateGoalsAndNotifyUser(vote, goals)) {
    validatedVote.goals = goals
  }
  await updateVote(validatedVote)
  await pushCandidateGoalsForCycle(validatedVote)
}

function fetchGoalsInfo(vote) {
  // get the cycle (which has a nested chapter) so that we have access to
  // the goalRepositoryURL, pass in that goalRepositoryURL to fetchGoalInfo
  const query = `
query($id: ID!) {
  getCycleById(id: $id) {
    id
    chapter {
      goalRepositoryURL
    }
  }
}
  `
  const args = {id: vote.cycleId}

  return graphql(rootSchema, query, {currentUser: true}, args)
    .then(graphQLResult => {
      const {goalRepositoryURL} = graphQLResult.data.getCycleById.chapter
      const promises = vote.notYetValidatedGoalDescriptors
        .map(goalDescriptor => fetchGoalInfo(goalRepositoryURL, goalDescriptor))
      return Promise.all(promises)
    })
}

function formatGoals(prefix, goals) {
  const goalLinks = goals.map((goal, i) => {
    const rank = i === 0 ? '1st' : '2nd'
    const goalIssueNum = goal.url.match(/\/(\d+)$/)[1]
    return `[(${goalIssueNum}) ${goal.title}](${goal.url}) [${rank} choice]`
  })
  return `${prefix}:\n - ${goalLinks.join('\n- ')}`
}

function validateGoalsAndNotifyUser(vote, goals) {
  const socket = getSocket()

  const invalidGoalDescriptors = vote.notYetValidatedGoalDescriptors
    .filter((goalDescriptor, i) => goals[i] === null)

  if (invalidGoalDescriptors.length > 0) {
    socket.publish(`${PREFIX_NOTIFY_USER}${vote.playerId}`, `The following goals are invalid: ${invalidGoalDescriptors.join(', ')}`)
    if (vote.goals) {
      socket.publish(`${PREFIX_NOTIFY_USER}${vote.playerId}`, formatGoals('Falling back to previous vote', vote.goals))
    }
    return false
  }

  socket.publish(`${PREFIX_NOTIFY_USER}${vote.playerId}`, formatGoals('Votes submitted for', goals))
  return true
}

function updateVote(vote) {
  const newVote = Object.assign({}, vote, {updatedAt: r.now()})
  return r.table('votes')
    .get(vote.id)
    .update(newVote)
    .run()
}

function pushCandidateGoalsForCycle(vote) {
  return getCycleById(vote.cycleId)
    .then(cycle => {
      return getCycleVotingResults(cycle.chapterId, cycle.id)
    })
    .then(cycleVotingResults => {
      const socket = getSocket()
      return socket.publish(`${PREFIX_CYCLE_NOTING_RESULTS}${vote.cycleId}`, cycleVotingResults)
    })
}
