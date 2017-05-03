import React, {Component, PropTypes} from 'react'

import ContentHeader from 'src/common/components/ContentHeader'
import ContentTable from 'src/common/components/ContentTable'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'

const {
  ELO,
  EXPERIENCE_POINTS,
  EXPERIENCE_POINTS_V2,
  LEVEL,
  LEVEL_V2,
} = STAT_DESCRIPTORS

const UserModel = {
  handle: {type: String},
  name: {type: String},
  chapterName: {title: 'Chapter', type: String},
  email: {type: String},
  active: {type: String},
}

const UserModelWithStats = {
  ...UserModel,
  [LEVEL]: {title: 'Level', type: String},
  [LEVEL_V2]: {title: 'Level.v2', type: String},
  [ELO]: {title: 'Elo', type: String},
  [EXPERIENCE_POINTS]: {title: 'XP', type: String},
  [EXPERIENCE_POINTS_V2]: {title: 'XP.v2', type: String},
}

export default class UserList extends Component {
  render() {
    const {users, allowSelect, onSelectRow} = this.props
    const rows = users.map(user => {
      const stats = user.stats || {}
      const experiencePoints = stats[EXPERIENCE_POINTS] || '--'
      const experiencePointsV2 = stats[EXPERIENCE_POINTS_V2] || '--'
      const elo = stats[ELO] || '--'
      // react-toolbox Table has a bug where it does not properly render falsey
      // values, so we have to convert a level of 0 to '0'
      const level = typeof stats[LEVEL] === 'number' ? `${stats[LEVEL]}` : '--'
      const levelV2 = typeof stats[LEVEL_V2] === 'number' ? `${stats[LEVEL_V2]}` : '--'
      const row = Object.assign({}, user, {
        chapterName: (user.chapter || {}).name,
        active: user.active ? 'Yes' : 'No',
      })
      if (stats && user.active) {
        Object.assign(row, {
          [ELO]: elo,
          [EXPERIENCE_POINTS]: experiencePoints,
          [LEVEL]: level,
          [EXPERIENCE_POINTS_V2]: experiencePointsV2,
          [LEVEL_V2]: levelV2,
        })
      }
      return row
    })
    const userModel = rows.find(row =>
      row[ELO] !== '--' ||
      row[EXPERIENCE_POINTS] !== '--' ||
      row[LEVEL] !== '--' ||
      row[EXPERIENCE_POINTS_V2] !== '--' ||
      row[LEVEL_V2] !== '--'
    ) ?
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
