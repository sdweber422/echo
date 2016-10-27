import React, {Component, PropTypes} from 'react'
import {push} from 'react-router-redux'
import {connect} from 'react-redux'
import socketCluster from 'socketcluster-client'

import {getPlayerIdsFromCandidateGoals} from 'src/common/util'
import {CYCLE_STATES, GOAL_SELECTION} from 'src/common/models/cycle'
import loadAllPlayersAndCorrespondingUsers from 'src/common/actions/loadAllPlayersAndCorrespondingUsers'
import loadCycleVotingResults, {receivedCycleVotingResults} from 'src/common/actions/loadCycleVotingResults'
import CycleVotingResults from 'src/common/components/CycleVotingResults'

class WrappedCycleVotingResults extends Component {
  constructor() {
    super()
    this.handleClose = this.handleClose.bind(this)
  }

  componentDidMount() {
    this.constructor.fetchData(this.props.dispatch, this.props)
    this.subscribeToCycleVotingResults(this.props.cycle)
  }

  componentWillUnmount() {
    this.unsubscribeFromCycleVotingResults(this.props.cycle)
  }

  componentWillReceiveProps(nextProps) {
    this.renewSubscriptionIfNecessary(nextProps.cycle, this.props.cycle)
  }

  renewSubscriptionIfNecessary(nextCycle, currentCycle) {
    if (!nextCycle) {
      return
    }
    if (!currentCycle || (nextCycle.id !== currentCycle.id)) {
      this.unsubscribeFromCycleVotingResults(currentCycle)
      this.subscribeToCycleVotingResults(nextCycle)
    }
  }

  subscribeToCycleVotingResults(cycle) {
    const {dispatch} = this.props
    if (cycle) {
      console.log(`subscribing to voting results for cycle ${cycle.id} ...`)
      this.socket = socketCluster.connect()
      this.socket.on('connect', () => console.log('... socket connected'))
      this.socket.on('disconnect', () => console.log('socket disconnected, will try to reconnect socket ...'))
      this.socket.on('connectAbort', () => null)
      this.socket.on('error', error => console.warn(error.message))
      const cycleVotingResultsChannel = this.socket.subscribe(`cycleVotingResults-${cycle.id}`)
      cycleVotingResultsChannel.watch(cycleVotingResults => {
        dispatch(receivedCycleVotingResults(cycleVotingResults))
      })
    }
  }

  unsubscribeFromCycleVotingResults(cycle) {
    if (this.socket && cycle) {
      console.log(`unsubscribing from voting results for cycle ${cycle.id} ...`)
      this.socket.unsubscribe(`cycleVotingResults-${cycle.id}`)
    }
  }

  static fetchData(dispatch) {
    // FIXME: don't do this -- backend should send all playerIds in each pool along with results
    dispatch(loadAllPlayersAndCorrespondingUsers())
    dispatch(loadCycleVotingResults())
  }

  handleClose() {
    this.props.dispatch(push('/'))
    /* global window */
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage('closeCycleVotingResults', '*')
    }
  }

  render() {
    return <CycleVotingResults onClose={this.handleClose} {...this.props}/>
  }
}

WrappedCycleVotingResults.propTypes = {
  cycle: PropTypes.shape({
    id: PropTypes.string.isRequired,
    cycleNumber: PropTypes.number.isRequired,
    state: PropTypes.oneOf(CYCLE_STATES),
  }),
  dispatch: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
  const {
    auth: {currentUser},
    cycles,
    chapters,
    players,
    users,
    cycleVotingResults,
  } = state
  const isBusy = cycles.isBusy || chapters.isBusy || cycleVotingResults.isBusy
  let cycle
  let chapter
  let isVotingStillOpen
  let candidateGoals = []
  let usersInPool = []
  let voterPlayerIds = []
  const cvResults = cycleVotingResults.cycleVotingResults.cycleVotingResults
  if (cvResults) {
    cycle = cycles.cycles[cvResults.cycle]
    chapter = cycle ? chapters.chapters[cycle.chapter] : null
    candidateGoals = cvResults.candidateGoals
    isVotingStillOpen = cycle && cycle.state === GOAL_SELECTION
    if (chapter && Object.keys(players.players).length > 0 && Object.keys(users.users).length > 0) {
      // FIXME: don't use chapter, use pool (once backend is ready)
      usersInPool = Object.keys(players.players)
        .map(playerId => players.players[playerId])
        .filter(player => player.chapter === chapter.id)
        .map(player => users.users[player.id])
        .filter(user => Boolean(user))

      if (candidateGoals.length > 0) {
        voterPlayerIds = getPlayerIdsFromCandidateGoals(candidateGoals)
      }
    }
  }
  const pools = [{
    candidateGoals,
    usersInPool,
    voterPlayerIds,
    isVotingStillOpen,
  }]

  return {
    currentUser,
    isBusy,
    chapter,
    cycle,
    pools,
  }
}

export default connect(mapStateToProps)(WrappedCycleVotingResults)
