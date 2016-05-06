import React, {Component, PropTypes} from 'react'

import {List, ListItem, ListSubHeader, ListDivider} from 'react-toolbox/lib/list'
import ProgressBar from 'react-toolbox/lib/progress_bar'

import {CYCLE_STATES} from '../validations/cycle'
import CandidateGoal from './CandidateGoal'

import styles from './CandidateGoalList.css'

export default class CandidateGoalList extends Component {
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
    const {percentageComplete} = this.props
    const progressBar = percentageComplete ? (
      <ProgressBar mode="determinate" value={percentageComplete}/>
    ) : ''
    const progressMsg = percentageComplete ? (
      <span>
        <strong className={styles.percentage}>{percentageComplete}</strong>
        <span>% of active players have voted.</span>
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

  render() {
    const {
      currentUser,
      chapter,
      cycle,
      goals,
    } = this.props

    const title = `Cycle ${cycle.cycleNumber} Candidate Goals (${chapter.name})`
    const goalList = goals.map((goal, i) => {
      return <CandidateGoal key={i} goal={goal} currentUser={currentUser}/>
    })

    return (
      <List>
        <ListSubHeader caption={title}/>
        {this.renderProgress()}
        <ListDivider/>
        {goalList}
        <ListDivider/>
        <ListItem
          leftIcon="book"
          >
          <a className={styles.link} href={chapter.goalRepositoryURL} target="_blank">
            View Goal Library
          </a>
        </ListItem>
      </List>
    )
  }
}

CandidateGoalList.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }),

  chapter: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    goalRepositoryURL: PropTypes.string.isRequired,
  }).isRequired,

  cycle: PropTypes.shape({
    id: PropTypes.string.isRequired,
    cycleNumber: PropTypes.number.isRequired,
    startTimestamp: PropTypes.instanceOf(Date).isRequired,
    state: PropTypes.oneOf(CYCLE_STATES),
  }).isRequired,

  goals: PropTypes.arrayOf(PropTypes.shape({
    playerIds: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    goal: PropTypes.shape({
      url: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }).isRequired,
  })).isRequired,

  percentageComplete: PropTypes.number,
  isVotingStillOpen: PropTypes.bool,
}
