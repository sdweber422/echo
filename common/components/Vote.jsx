import React, {Component, PropTypes} from 'react'

import {Button} from 'react-toolbox/lib/button'
import {ListItem} from 'react-toolbox/lib/list'

import styles from './Vote.css'

export default class Vote extends Component {
  render() {
    const {currentUser, vote} = this.props
    const rightActions = [(
      <span
        key="voteCount"
        className={styles.rightAction}
        >
        ({vote.playerIds.length})
      </span>
    ), (
      <Button
        key="goalLink"
        className={styles.rightAction}
        icon="open_in_new"
        href={vote.goal.url}
        target="_blank"
        />
    )]

    const itemContent = (
      <span className={styles.goalName}>
        {vote.goal.name}
      </span>
    )

    const wasVotedOnByCurrentUser = vote.playerIds.indexOf(currentUser.id) >= 0
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

Vote.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }),

  vote: PropTypes.shape({
    id: PropTypes.string.isRequired,
    playerIds: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    goal: PropTypes.shape({
      url: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }).isRequired,
  }),
}
