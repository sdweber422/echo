import React, {Component, PropTypes} from 'react'
import {List, ListItem, ListSubHeader, ListDivider} from 'react-toolbox/lib/list'
import ProgressBar from 'react-toolbox/lib/progress_bar'

import {CYCLE_STATES} from 'src/common/models/cycle'
import CandidateGoal from 'src/common/components/CandidateGoal'

import styles from './index.css'

export default class VotingPoolResults extends Component {
  renderVotingOpenOrClosed() {
    const {pool: {isVotingStillOpen}} = this.props
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
    const {pool: {usersInPool, voterPlayerIds}} = this.props

    let progressBar = ''
    let progressMsg = ''
    if (usersInPool && usersInPool.length > 0 && voterPlayerIds) {
      const percentageComplete = Math.floor(voterPlayerIds.length / usersInPool.length * 100)
      progressBar = (
        <ProgressBar mode="determinate" value={percentageComplete}/>
      )
      progressMsg = (
        <span>
          <strong className={styles.numPlayers}>{voterPlayerIds.length}/{usersInPool.length}</strong>
          <span> players have voted.</span>
        </span>
      )
    }

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

  // TODO: extract this into its own component
  renderPlayerGrid() {
    const {pool: {usersInPool, voterPlayerIds}} = this.props
    if (!usersInPool || usersInPool.length === 0 || !voterPlayerIds || voterPlayerIds.length === 0) {
      return <span/>
    }

    const nonVoterPlayerIds = usersInPool.filter(user => !voterPlayerIds.includes(user.id))
      .map(user => user.id)

    const _imagesForPlayerIds = (playerIds, classNames, baseKey) => {
      const {pool: {usersInPool}} = this.props
      return playerIds.map((playerId, i) => {
        const user = usersInPool.find(user => user.id === playerId)
        return (
          <img
            key={baseKey + i}
            className={classNames}
            src={user.avatarUrl}
            alt={user.handle}
            title={user.handle}
            />
        )
      })
    }

    const voterUserImages = _imagesForPlayerIds(voterPlayerIds, styles.userImage, 1000)
    const nonVoterUserImages = _imagesForPlayerIds(nonVoterPlayerIds, `${styles.userImage} ${styles.nonVotingUserImage}`, 2000)

    return (
      <ListItem ripple={false} theme={styles}>
        <div className={styles.userGrid}>
          {voterUserImages.concat(nonVoterUserImages)}
        </div>
      </ListItem>
    )
  }

  renderTitle() {
    const {pool} = this.props
    const current = '(current)' // TODO: figure out how to know whether this is the "current" pool
    if (!pool.name) {
      return <span/>
    }
    const title = `${pool.name} Pool ${current}`
    return <ListSubHeader caption={title}/>
  }

  render() {
    const {
      currentUser,
      cycle,
      pool,
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

    const goalList = pool.candidateGoals.map((candidateGoal, i) => {
      return <CandidateGoal key={i} candidateGoal={candidateGoal} currentUser={currentUser}/>
    })
    const body = !isCollapsed ? (
      <div>
        {this.renderPlayerGrid()}
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

  cycle: PropTypes.shape({
    state: PropTypes.oneOf(CYCLE_STATES),
  }),

  isCollapsed: PropTypes.bool.isRequired,

  pool: PropTypes.shape({
    name: PropTypes.string, // FIXME: this should be required once pools are ready
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
    usersInPool: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      handle: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      avatarUrl: PropTypes.string.isRequired,
    })).isRequired,
    voterPlayerIds: PropTypes.array.isRequired,
    isVotingStillOpen: PropTypes.bool,
  }),

  isBusy: PropTypes.bool.isRequired,
}
