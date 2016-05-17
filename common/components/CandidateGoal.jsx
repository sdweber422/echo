import React, {Component, PropTypes} from 'react'
import md5 from 'md5'
import fetch from 'isomorphic-fetch'

import Avatar from 'react-toolbox/lib/avatar'
import {ListItem} from 'react-toolbox/lib/list'

import styles from './CandidateGoal.css'

function rank(num) {
  switch (num) {
    case 1:
      return <span>1<sup className={styles.placement}>st</sup></span>
    case 2:
      return <span>2<sup className={styles.placement}>nd</sup></span>
    default:
      return <span>{num}</span>
  }
}

export default class CandidateGoal extends Component {
  renderAvatar(currentUser, wasVotedOnByCurrentUser) {
    return wasVotedOnByCurrentUser ? (
      <PlayerAvatar
        key="avatar"
        currentUser={currentUser}
        />
    ) : (
      <span key="avatar"/>
    )
  }

  renderGoalRank(goalRank) {
    return goalRank ? (
      <div
        key="goalRank"
        title="your rank"
        className={`${styles.rightAction} ${styles.goalRank}`}
        >
        {rank(goalRank)}
      </div>
    ) : (
      <span key="goalRank"/>
    )
  }

  renderVoteCount(candidateGoal) {
    return (
      <div
        key="voteCount"
        title="number of votes"
        className={`${styles.rightAction} ${styles.voteCount}`}
        >
        {candidateGoal.playerGoalRanks.length}
      </div>
    )
  }

  renderRightActions() {
    const {currentUser, candidateGoal} = this.props

    let wasVotedOnByCurrentUser = false
    let goalRank = null
    candidateGoal.playerGoalRanks.forEach(playerGoalRank => {
      if (playerGoalRank.playerId === currentUser.id) {
        wasVotedOnByCurrentUser = true
        goalRank = playerGoalRank.goalRank + 1
      }
    })

    return [
      this.renderAvatar(currentUser, wasVotedOnByCurrentUser),
      this.renderGoalRank(goalRank),
      this.renderVoteCount(candidateGoal),
    ]
  }

  render() {
    const {currentUser, candidateGoal} = this.props

    const goalNumber = candidateGoal.goal.url.match(/\d+$/)
    const itemContent = (
      <span className={styles.goalTitle}>
        <span className={styles.goalNumber}>{goalNumber}:</span>
        <a target="_blank" href={candidateGoal.goal.url} title={candidateGoal.goal.title}> {candidateGoal.goal.title}</a>
      </span>
    )

    const playerIds = candidateGoal.playerGoalRanks.map(playerGoalRank => playerGoalRank.playerId)
    const wasVotedOnByCurrentUser = playerIds.indexOf(currentUser.id) >= 0
    const votedClassName = wasVotedOnByCurrentUser ? styles.voted : ''

    return (
      <ListItem
        className={`${styles.listItem} ${votedClassName}`}
        itemContent={itemContent}
        rightActions={this.renderRightActions(wasVotedOnByCurrentUser)}
        selectable={false}
        ripple={false}
        />
    )
  }
}

CandidateGoal.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),

  candidateGoal: PropTypes.shape({
    goal: PropTypes.shape({
      url: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
    }).isRequired,
    playerGoalRanks: PropTypes.arrayOf(PropTypes.shape({
      playerId: PropTypes.string.isRequired,
      goalRank: PropTypes.number.isRequired,
    })).isRequired,
  }),
}

// This may _seem_ like it's a component that should be extracted into it's own
// file, and at some point it might be. However, for now, it's very tightly
// coupled to the CandidateGoal component.
class PlayerAvatar extends Component {
  constructor(props) {
    super(props)
    this.state = {
      gravatarExists: false,
    }
  }

  gravatarURL(props) {
    return `https://www.gravatar.com/avatar/${md5(props.currentUser.email)}`
  }

  componentDidMount() {
    this.updateGravatarExistsState(this.props)
  }

  updateGravatarExistsState(props) {
    fetch(`${this.gravatarURL(props)}.jpg?d=404`, {method: 'HEAD'})
      .then(resp => {
        const gravatarExists = (resp.status !== 404)
        this.setState({gravatarExists})
      })
  }

  componentWillReceiveProps(newProps) {
    this.updateGravatarExistsState(newProps)
  }

  renderGravatar() {
    return (
      <img title="you voted for this goal" src={`${this.gravatarURL(this.props)}?s=40`}/>
    )
  }

  renderInitials() {
    const {currentUser: {name}} = this.props
    const nameParts = name.split(/[\W]+/)
    const initials = nameParts.length > 1 ? `${nameParts[0][0]}${nameParts[1][0]}` : `${nameParts[0][0]}${nameParts[0][1]}`
    return (
      <div title="you voted for this goal" className={styles.initials}>{initials.toUpperCase()}</div>
    )
  }

  render() {
    const {gravatarExists} = this.state
    return (
      <Avatar className={styles.avatar}>
        {gravatarExists ? this.renderGravatar() : this.renderInitials()}
      </Avatar>
    )
  }
}

PlayerAvatar.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
}
