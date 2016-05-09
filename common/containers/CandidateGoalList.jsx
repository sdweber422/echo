import React, {Component, PropTypes} from 'react'

import {connect} from 'react-redux'
import socketCluster from 'socketcluster-client'

import loadCycle from '../actions/loadCycle'
import loadCycleGoals, {receivedCycleGoals} from '../actions/loadCycleGoals'
import CandidateGoalList from '../components/CandidateGoalList'

class WrappedCandidateGoalList extends Component {
  componentDidMount() {
    this.constructor.fetchData(this.props.dispatch, this.props)
    this.subscribeToCycleGoals()
  }

  componentWillUnmount() {
    this.unsubscribeFromCycleGoals()
  }

  subscribeToCycleGoals() {
    const {params, dispatch} = this.props
    const cycleId = params.id
    this.socket = socketCluster.connect()
    this.socket.on('connect', () => console.log('... socket connected'))
    this.socket.on('disconnect', () => console.log('socket disconnected, will try to reconnect socket ...'))
    this.socket.on('connectAbort', () => null)
    this.socket.on('error', error => console.warn(error.message))
    const cycleGoalsChannel = this.socket.subscribe(`cycleGoals-${cycleId}`)
    cycleGoalsChannel.watch(cycleGoals => {
      dispatch(receivedCycleGoals(cycleId, cycleGoals))
    })
  }

  unsubscribeFromCycleGoals() {
    if (this.socket) {
      const {params} = this.props
      const cycleId = params.id
      this.socket.unsubscribe(`cycleGoals-${cycleId}`)
    }
  }

  static fetchData(dispatch, props) {
    const {params: {id}} = props
    if (id) {
      dispatch(loadCycle(id))
      dispatch(loadCycleGoals(id))
    }
  }

  render() {
    return <CandidateGoalList {...this.props}/>
  }
}

WrappedCandidateGoalList.propTypes = {
  dispatch: PropTypes.func.isRequired,
  params: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,
}

function mapStateToProps(state, props) {
  const {params: {id}} = props

  const currentUser = state.auth.currentUser
  const isBusy = state.cycles.isBusy || state.chapters.isBusy || state.cycleGoals.isBusy
  const cycle = state.cycles.cycles[id]
  const chapter = cycle ? state.chapters.chapters[cycle.chapter] : null
  const candidateGoals = state.cycleGoals.cycleGoals[id]

  return {
    currentUser,
    chapter,
    cycle,
    candidateGoals,
    isBusy,
    // percentageComplete: 72,
    // isVotingStillOpen: true,
  }
}

export default connect(mapStateToProps)(WrappedCandidateGoalList)
