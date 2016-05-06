import React, {Component, PropTypes} from 'react'

import {List, ListItem, ListSubHeader, ListDivider} from 'react-toolbox/lib/list'
import ProgressBar from 'react-toolbox/lib/progress_bar'

import {CYCLE_STATES} from '../validations/cycle'
import Vote from './Vote'

import styles from './VoteList.css'

export default class VoteList extends Component {
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
      votes,
    } = this.props

    const title = `Cycle ${cycle.cycleNumber} Votes (${chapter.name})`
    const voteList = votes.map((vote, i) => {
      return <Vote key={i} vote={vote} currentUser={currentUser}/>
    })

    return (
      <List>
        <ListSubHeader caption={title}/>
        {this.renderProgress()}
        <ListDivider/>
        {voteList}
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

VoteList.propTypes = {
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

  votes: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    playerIds: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    goal: PropTypes.shape({
      url: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }).isRequired,
  })).isRequired,

  percentageComplete: PropTypes.number,
  isVotingStillOpen: PropTypes.bool,
}
