import {connect} from 'react-redux'

import {userCan} from 'src/common/util'
import Home from 'src/common/components/Home'

function mapStateToProps(state) {
  const {auth: {currentUser}} = state

  return {
    showListChapters: userCan(currentUser, 'listChapters'),
    showListPlayers: userCan(currentUser, 'listPlayers'),
  }
}

export default connect(mapStateToProps)(Home)
