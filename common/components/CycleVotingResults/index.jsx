import React, {Component, PropTypes} from 'react'
import {List, ListItem, ListSubHeader, ListDivider} from 'react-toolbox/lib/list'
import ProgressBar from 'react-toolbox/lib/progress_bar'

import {CYCLE_STATES} from 'src/common/models/cycle'
import VotingPoolResults from 'src/common/components/VotingPoolResults'

import styles from './index.css'

export default class CycleVotingResults extends Component {
  render() {
    const {
      currentUser,
      chapter,
      cycle,
      pools,
      isBusy,
      onClose,
    } = this.props

    if (isBusy) {
      return (
        <ProgressBar mode="indeterminate"/>
      )
    }

    if (!cycle) {
      return (
        <div>There are currently no voting results to display.</div>
      )
    }

    const title = `Cycle ${cycle.cycleNumber} Candidate Goals (${chapter.name})`
    const goalLibraryURL = `${chapter.goalRepositoryURL}/issues`
    const defaultPool = (
      <VotingPoolResults
        currentUser={currentUser}
        cycle={cycle}
        pool={pools[0]}
        isCollapsed={false}
        isBusy={isBusy}
        />
    )

    return (
      <List>
        <ListSubHeader caption={title}/>
        <ListDivider/>
        {defaultPool}
        <a href={goalLibraryURL} target="_blank">
          <ListItem leftIcon="book" caption="View Goal Library"/>
        </a>
        <a onClick={onClose} className={styles.clickLink}>
          <ListItem leftIcon="close" caption="Close Voting Results"/>
        </a>
      </List>
    )
  }
}

CycleVotingResults.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,

  chapter: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    goalRepositoryURL: PropTypes.string.isRequired,
  }),

  cycle: PropTypes.shape({
    id: PropTypes.string.isRequired,
    cycleNumber: PropTypes.number.isRequired,
    state: PropTypes.oneOf(CYCLE_STATES),
  }),

  pools: PropTypes.arrayOf(PropTypes.shape({
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
  })),

  isBusy: PropTypes.bool.isRequired,

  onClose: PropTypes.func.isRequired,
}
