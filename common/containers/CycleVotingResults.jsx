import React, {Component, PropTypes} from 'react'

import {connect} from 'react-redux'
import socketCluster from 'socketcluster-client'

import loadCycle from '../actions/loadCycle'
import loadCycleVotingResults, {receivedCycleVotingResults} from '../actions/loadCycleVotingResults'
import CycleVotingResults from '../components/CycleVotingResults'

class WrappedCycleVotingResults extends Component {
  componentDidMount() {
    this.constructor.fetchData(this.props.dispatch, this.props)
    this.subscribeToCycleVotingResults()
  }

  componentWillUnmount() {
    this.unsubscribeFromCycleVotingResults()
  }

  subscribeToCycleVotingResults() {
    const {params, dispatch} = this.props
    const cycleId = params.id
    this.socket = socketCluster.connect()
    this.socket.on('connect', () => console.log('... socket connected'))
    this.socket.on('disconnect', () => console.log('socket disconnected, will try to reconnect socket ...'))
    this.socket.on('connectAbort', () => null)
    this.socket.on('error', error => console.warn(error.message))
    const cycleVotingResultsChannel = this.socket.subscribe(`cycleVotingResults-${cycleId}`)
    cycleVotingResultsChannel.watch(cycleVotingResults => {
      dispatch(receivedCycleVotingResults(cycleId, cycleVotingResults))
    })
  }

  unsubscribeFromCycleVotingResults() {
    if (this.socket) {
      const {params} = this.props
      const cycleId = params.id
      this.socket.unsubscribe(`cycleVotingResults-${cycleId}`)
    }
  }

  static fetchData(dispatch, props) {
    const {params: {id}} = props
    if (id) {
      dispatch(loadCycle(id))
      dispatch(loadCycleVotingResults(id))
    }
  }

  render() {
    return <CycleVotingResults {...this.props}/>
  }
}

WrappedCycleVotingResults.propTypes = {
  dispatch: PropTypes.func.isRequired,
  params: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,
}

function mapStateToProps(state, props) {
  const {params: {id}} = props

  const currentUser = state.auth.currentUser
  const isBusy = state.cycles.isBusy || state.chapters.isBusy || state.cycleVotingResults.isBusy
  const cycle = state.cycles.cycles[id]
  const chapter = cycle ? state.chapters.chapters[cycle.chapter] : null
  const cycleVotingResults = state.cycleVotingResults.cycleVotingResults[id]
  let candidateGoals
  let percentageComplete
  let isVotingStillOpen
  if (cycleVotingResults) {
    candidateGoals = cycleVotingResults.candidateGoals
    percentageComplete = Math.floor(cycleVotingResults.numVotes / cycleVotingResults.numEligiblePlayers * 100)
    isVotingStillOpen = cycleVotingResults.cycleState === 'GOAL_SELECTION'
  }

  return {
    currentUser,
    isBusy,
    chapter,
    cycle,
    candidateGoals,
    percentageComplete,
    isVotingStillOpen,
  }
}

export default connect(mapStateToProps)(WrappedCycleVotingResults)
