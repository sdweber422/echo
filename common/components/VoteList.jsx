import React, {Component, PropTypes} from 'react'

import {CardTitle} from 'react-toolbox/lib/card'
import {List} from 'react-toolbox/lib/list'

import {CYCLE_STATES} from '../validations/cycle'
import Vote from './Vote'

export default class VoteList extends Component {
  render() {
    const {chapter, cycle, votes} = this.props

    const title = `Cycle ${cycle.cycleNumber} Votes (${chapter.name})`
    const voteList = votes.map((vote, i) => {
      return <Vote key={i} vote={vote}/>
    })

    return (
      <div>
        <CardTitle title={title}/>
        <List>
          {voteList}
        </List>
      </div>
    )
  }
}

VoteList.propTypes = {
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
}
