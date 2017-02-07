import React, {Component, PropTypes} from 'react'

import ContentHeader from 'src/common/components/ContentHeader'
import ContentTable from 'src/common/components/ContentTable'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'

const {
  ELO,
  EXPERIENCE_POINTS,
  LEVEL,
} = STAT_DESCRIPTORS

const UserModel = {
  handle: {type: String},
  name: {type: String},
  chapterName: {title: 'Chapter', type: String},
  email: {type: String},
  active: {type: Boolean},
}

const UserModelWithStats = {
  ...UserModel,
  [LEVEL]: {title: 'Level', type: Number},
  [ELO]: {title: 'Elo', type: Number},
  [EXPERIENCE_POINTS]: {title: 'XP', type: Number},
}

export default class UserList extends Component {
  render() {
    const {users, allowSelect, onSelectRow} = this.props
    const rows = users.map(user => {
      const stats = user.stats || {}
      const experiencePoints = stats[EXPERIENCE_POINTS] || '--'
      const elo = stats[ELO] || '--'
      const level = stats[LEVEL] || '--'
      const row = Object.assign({}, user, {
        chapterName: (user.chapter || {}).name,
        active: user.active ? 'Yes' : 'No',
      })
      if (stats) {
        Object.assign(row, {
          [ELO]: elo,
          [EXPERIENCE_POINTS]: experiencePoints,
          [LEVEL]: level,
        })
      }
      return row
    })
    const userModel = rows.find(row => row[ELO] !== '--' || row[EXPERIENCE_POINTS] !== '--' || row[LEVEL] !== '--') ?
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
      [STAT_DESCRIPTORS.ELO]: PropTypes.number,
    }),
  })),
}
