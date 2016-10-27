import React, {Component, PropTypes} from 'react'
import {List, ListItem, ListSubHeader, ListDivider} from 'react-toolbox/lib/list'
import ProgressBar from 'react-toolbox/lib/progress_bar'

import {CYCLE_STATES} from 'src/common/models/cycle'
import CandidateGoal from 'src/common/components/CandidateGoal'

import styles from './index.css'

export default class VotingPoolResults extends Component {
  renderVotingOpenOrClosed() {
    const {isVotingStillOpen} = this.props
    return typeof isVotingStillOpen !== 'undefined' ? (
      <span>
        <span>  Voting is </span>
        <strong className={isVotingStillOpen ? styles.open : styles.closed}>
          {isVotingStillOpen ? 'still open' : 'closed'}.
        </strong>
      </span>
    ) : ''
  }

  renderProgress() {
    const {numEligiblePlayers, numVoters} = this.props
    const percentageComplete = Math.floor(numVoters / numEligiblePlayers * 100)

    const progressBar = percentageComplete ? (
      <ProgressBar mode="determinate" value={percentageComplete}/>
    ) : ''
    const progressMsg = numEligiblePlayers ? (
      <span>
        <strong className={styles.numPlayers}>{numVoters}/{numEligiblePlayers}</strong>
        <span> players have voted.</span>
      </span>
    ) : ''
    const votingOpenOrClosedMsg = this.renderVotingOpenOrClosed()
    const itemContent = (progressBar || progressMsg || votingOpenOrClosedMsg) ? (
      <div className={styles.progress}>
        {progressBar}
        <div>
          {progressMsg}
          {votingOpenOrClosedMsg}
        </div>
      </div>
    ) : ''

    return itemContent ? (
      <ListItem itemContent={itemContent}/>
    ) : <span/>
  }

  renderTitle() {
    const {pool} = this.props
    const current = '(current)' // TODO: figure out how to know whether this is the "current" pool
    const title = `${pool.name} Pool ${current}`
    return <ListSubHeader caption={title}/>
  }

  render() {
    const {
      currentUser,
      cycle,
      candidateGoals,
      isBusy,
      isCollapsed,
    } = this.props

    if (isBusy) {
      return (
        <ProgressBar mode="indeterminate"/>
      )
    }

    if (!cycle) {
      return (
        <div>No one in this pool has voted yet.</div>
      )
    }

    const goalList = candidateGoals.map((candidateGoal, i) => {
      return <CandidateGoal key={i} candidateGoal={candidateGoal} currentUser={currentUser}/>
    })
    const body = !isCollapsed ? (
      <div>
        {goalList}
        <ListDivider/>
      </div>
    ) : <span/>

    return (
      <List>
        {this.renderTitle()}
        {this.renderProgress()}
        {body}
      </List>
    )
  }
}

VotingPoolResults.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,

  pool: PropTypes.shape({
    name: PropTypes.string.isRequired,
  }),

  cycle: PropTypes.shape({
    state: PropTypes.oneOf(CYCLE_STATES),
  }),

  candidateGoals: PropTypes.arrayOf(PropTypes.shape({
    goal: PropTypes.shape({
      url: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
    }).isRequired,
    playerGoalRanks: PropTypes.arrayOf(PropTypes.shape({
      playerId: PropTypes.string.isRequired,
      goalRank: PropTypes.number.isRequired,
    })).isRequired,
  })),

  isBusy: PropTypes.bool.isRequired,
  isCollapsed: PropTypes.bool.isRequired,

  numEligiblePlayers: PropTypes.number,
  numVoters: PropTypes.number,
  isVotingStillOpen: PropTypes.bool,
}
