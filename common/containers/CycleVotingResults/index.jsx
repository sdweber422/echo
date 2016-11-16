import React, {Component, PropTypes} from 'react'
import {push} from 'react-router-redux'
import {connect} from 'react-redux'
import socketCluster from 'socketcluster-client'

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
    // FIXME: don't load all players and users -- backend should send all
    // playerIds in each pool along with results
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

function addUserDataToPools(pools, allUsers) {
  pools.forEach(pool => {
    const userDatas = pool.users.map(({id}) => allUsers[id])
    pool.users = userDatas
  })
}

function mapStateToProps(state) {
  const {
    auth: {currentUser},
    cycles,
    chapters,
    users,
    cycleVotingResults: cvResults,
  } = state
  const isBusy = cycles.isBusy || chapters.isBusy || cvResults.isBusy || users.isBusy
  // this part of the state is a singleton, which is why this looks weird
  const cycleVotingResults = cvResults.cycleVotingResults.CURRENT
  let cycle
  let chapter
  let pools = []
  if (!isBusy) {
    cycle = cycles.cycles[cycleVotingResults.cycle]
    chapter = cycle ? chapters.chapters[cycle.chapter] : null
    pools = cycleVotingResults.pools
    addUserDataToPools(pools, users.users)
  }

  return {
    currentUser,
    isBusy,
    chapter,
    cycle,
    pools,
  }
}

export default connect(mapStateToProps)(WrappedCycleVotingResults)
