import React, {Component, PropTypes} from 'react'

import {Button} from 'react-toolbox/lib/button'
import {ListItem} from 'react-toolbox/lib/list'

import styles from './CandidateGoal.css'

export default class CandidateGoal extends Component {
  render() {
    const {currentUser, goal} = this.props
    const rightActions = [(
      <span
        key="voteCount"
        className={styles.rightAction}
        >
        ({goal.playerIds.length})
      </span>
    ), (
      <Button
        key="goalLink"
        className={styles.rightAction}
        icon="open_in_new"
        href={goal.goal.url}
        target="_blank"
        />
    )]

    const itemContent = (
      <span className={styles.goalName}>
        {goal.goal.name}
      </span>
    )

    const wasVotedOnByCurrentUser = goal.playerIds.indexOf(currentUser.id) >= 0
    const votedClassName = wasVotedOnByCurrentUser ? styles.voted : ''

    return (
      <ListItem
        className={`${styles.listItem} ${votedClassName}`}
        itemContent={itemContent}
        rightActions={rightActions}
        selectable={false}
        ripple={false}
        />
    )
  }
}

CandidateGoal.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }),

  goal: PropTypes.shape({
    id: PropTypes.string.isRequired,
    playerIds: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    goal: PropTypes.shape({
      url: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }).isRequired,
  }),
}
