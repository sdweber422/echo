import {connect} from 'react-redux'

import {userCan} from '../util'
import Home from '../components/Home'

function mapStateToProps(state) {
  const {auth: {currentUser}} = state

  return {
    showListChapters: userCan(currentUser, 'listChapters'),
    showListPlayers: userCan(currentUser, 'listPlayers'),
  }
}

export default connect(mapStateToProps)(Home)
