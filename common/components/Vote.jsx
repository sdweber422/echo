import React, {Component, PropTypes} from 'react'

import {Button} from 'react-toolbox/lib/button'
import {ListItem} from 'react-toolbox/lib/list'

import {CYCLE_STATES} from '../validations/cycle'

export default class Vote extends Component {
  render() {
    const {vote} = this.props
    const rightActions = [(
        <span key={2}>({vote.playerIds.length})</span>
    ), (
      <Button
        key={1}
        icon="open_in_new"
        href={vote.goal.url}
        target="_blank"
        />
    )]

    return (
      <ListItem
        caption={vote.goal.name}
        rightActions={rightActions}
        />
    )
  }
}

Vote.propTypes = {
  vote: PropTypes.shape({
    id: PropTypes.string.isRequired,
    playerIds: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    goal: PropTypes.shape({
      url: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }).isRequired,
  }),
}
