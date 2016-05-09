import React, {Component, PropTypes} from 'react'

import {connect} from 'react-redux'
import socketCluster from 'socketcluster-client'

import loadCycle from '../actions/loadCycle'
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
    const {params} = this.props
    const cycleId = params.id
    this.socket = socketCluster.connect()
    const candidateGoalsChannel = this.socket.subscribe(`cycleGoals-${cycleId}`)
    candidateGoalsChannel.watch(candidateGoals => {
      this.setState({candidateGoals})
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
    }
  }

  render() {
    return <CandidateGoalList {...this.props} {...this.state}/>
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
  const isBusy = state.cycles.isBusy || state.chapters.isBusy
  const cycle = state.cycles.cycles[id]
  const chapter = cycle ? state.chapters.chapters[cycle.chapter] : null

  return {
    currentUser,
    chapter,
    cycle,
    candidateGoals: [],
    isBusy,
    // percentageComplete: 72,
    // isVotingStillOpen: true,
  }
}

export default connect(mapStateToProps)(WrappedCandidateGoalList)
