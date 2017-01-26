import React, {Component, PropTypes} from 'react'

import ContentHeader from 'src/common/components/ContentHeader'
import ContentTable from 'src/common/components/ContentTable'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'

const UserModel = {
  handle: {type: String},
  name: {type: String},
  chapterName: {title: 'Chapter', type: String},
  email: {type: String},
  active: {type: Boolean},
}

const UserModelWithStats = {
  ...UserModel,
  elo: {title: 'Elo', type: Number},
  xp: {title: 'XP', type: Number},
}

export default class UserList extends Component {
  render() {
    const {users, allowSelect, onSelectRow} = this.props
    const rows = users.map(user => {
      const stats = user.stats || {}
      const xp = stats[STAT_DESCRIPTORS.EXPERIENCE_POINTS] || '--'
      const elo = stats[STAT_DESCRIPTORS.RATING_ELO] || '--'
      const row = Object.assign({}, user, {
        chapterName: (user.chapter || {}).name,
        active: user.active ? 'Yes' : 'No',
      })
      if (stats) {
        Object.assign(row, {elo, xp})
      }
      return row
    })
    const userModel = rows.find(row => row.elo !== '--' || row.xp !== '--') ?
      UserModelWithStats :
      UserModel
    const content = rows.length > 0 ? (
      <ContentTable
        model={userModel}
        source={rows}
        allowSelect={allowSelect}
        onSelectRow={onSelectRow}
        />
    ) : (
      <div>No user yet.</div>
    )

    return (
      <div>
        <ContentHeader title="Users"/>
        {content}
      </div>
    )
  }
}

UserList.propTypes = {
  allowSelect: PropTypes.bool,
  onSelectRow: PropTypes.func,
  users: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    handle: PropTypes.string.isRequired,
    email: PropTypes.string,
    active: PropTypes.bool,
    chapter: PropTypes.shape({
      name: PropTypes.string,
    }),
    stats: PropTypes.shape({
      [STAT_DESCRIPTORS.EXPERIENCE_POINTS]: PropTypes.number,
      [STAT_DESCRIPTORS.RATING_ELO]: PropTypes.number,
    }),
  })),
}
