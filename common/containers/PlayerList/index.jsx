import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'

import ProgressBar from 'react-toolbox/lib/progress_bar'

import {userCan} from 'src/common/util'
import PlayerListComponent from 'src/common/components/PlayerList'
import loadAllPlayersAndCorrespondingUsers from 'src/common/actions/loadAllPlayersAndCorrespondingUsers'
import loadChapters from 'src/common/actions/loadChapters'
import reassignPlayersToChapter from 'src/common/actions/reassignPlayersToChapter'

class PlayerList extends Component {
  constructor(props) {
    super(props)
    this.handleReassignPlayersToChapter = this.handleReassignPlayersToChapter.bind(this)
  }

  componentDidMount() {
    this.constructor.fetchData(this.props.dispatch, this.props)
  }

  static fetchData(dispatch) {
    dispatch(loadChapters())
    dispatch(loadAllPlayersAndCorrespondingUsers())
  }

  handleReassignPlayersToChapter(playerIds, chapterId) {
    const {dispatch} = this.props
    dispatch(reassignPlayersToChapter(playerIds, chapterId))
  }

  render() {
    const {playersById, users, chapters, isBusy, currentUser} = this.props
    if (isBusy) {
      return <ProgressBar/>
    }

    return (
      <PlayerListComponent
        playersById={playersById}
        users={users}
        chapters={chapters}
        showReassignPlayersToChapter={userCan(currentUser, 'reassignPlayersToChapter')}
        onReassignPlayersToChapter={this.handleReassignPlayersToChapter}
        />
    )
  }
}

PlayerList.propTypes = {
  currentUser: PropTypes.object.isRequired,
  playersById: PropTypes.object.isRequired,
  users: PropTypes.array.isRequired,
  chapters: PropTypes.array.isRequired,
  isBusy: PropTypes.bool.isRequired,
  dispatch: PropTypes.func.isRequired,
}

function stateObjectToSortedArray(obj, attr) {
  return Object.keys(obj)
    .map(id => obj[id])
    .sort((a, b) => {
      if (a[attr] < b[attr]) {
        return -1
      } else if (a[attr] === b[attr]) {
        return 0
      }
      return 1
    })
}

function mapStateToProps(state) {
  const {players, chapters, users} = state
  const userList = stateObjectToSortedArray(users.users, 'handle')
  const chapterList = stateObjectToSortedArray(chapters.chapters, 'name')

  return {
    currentUser: state.auth.currentUser,
    chapters: chapterList,
    playersById: players.players,
    users: userList,
    isBusy: players.isBusy || chapters.isBusy || users.isBusy,
  }
}

export default connect(mapStateToProps)(PlayerList)
