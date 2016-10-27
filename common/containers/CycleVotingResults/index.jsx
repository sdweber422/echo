import React, {Component, PropTypes} from 'react'
import {push} from 'react-router-redux'
import {connect} from 'react-redux'
import socketCluster from 'socketcluster-client'

import {getPlayerIdsFromCandidateGoals} from 'src/common/util'
import {GOAL_SELECTION} from 'src/common/models/cycle'
import loadAllPlayersAndCorrespondingUsers from 'src/common/actions/loadAllPlayersAndCorrespondingUsers'
import loadCycleVotingResults, {receivedCycleVotingResults} from 'src/common/actions/loadCycleVotingResults'
import CycleVotingResults, {cycleVotingResultsPropType} from 'src/common/components/CycleVotingResults'

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

WrappedCycleVotingResults.propTypes = Object.assign({}, cycleVotingResultsPropType, {
  dispatch: PropTypes.func.isRequired,
})

// FIXME: remove this once the shape of the incoming data from the server looks
// more like what we want
function _defaultVotingPoolProps(players, users, cycleVotingResults, cycle, chapter) {
  let isVotingStillOpen
  let candidateGoals = []
  let usersInPool = []
  let voterPlayerIds = []
  if (cycleVotingResults) {
    candidateGoals = cycleVotingResults.candidateGoals
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

  return {
    candidateGoals,
    users: usersInPool,
    voterPlayerIds,
    isVotingStillOpen,
  }
}

function mapStateToProps(state) {
  const {
    auth: {currentUser},
    cycles,
    chapters,
    players,
    users,
    cycleVotingResults: cvResults,
  } = state
  const isBusy = cycles.isBusy || chapters.isBusy || cvResults.isBusy
  // this part of the state is a singleton, which is why this looks weird
  const cycleVotingResults = cvResults.cycleVotingResults.cycleVotingResults
  let cycle
  let chapter
  if (cycleVotingResults) {
    cycle = cycles.cycles[cycleVotingResults.cycle]
    chapter = cycle ? chapters.chapters[cycle.chapter] : null
  }

  return {
    currentUser,
    isBusy,
    chapter,
    cycle,
    pools: [_defaultVotingPoolProps(players, users, cycleVotingResults, cycle, chapter)]
  }
}

export default connect(mapStateToProps)(WrappedCycleVotingResults)
