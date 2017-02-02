import React, {PropTypes} from 'react'
import StatDifference from 'src/common/components/UserProjectSummary/StatDifference'
import {Flex} from 'src/common/components/Layout'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {roundDecimal} from 'src/common/util'
import {userStatsPropType} from 'src/common/components/UserProjectSummary'

const BLANK = '--'
const renderStat = (stat, userStats) => Number.isFinite(userStats[stat]) ? roundDecimal(userStats[stat]) : BLANK

const ProjectStatColumn = props => {
  const {className, columnName, columnStats} = props

  return (
    <Flex className={(className)} column>
      {
        columnName ?
          <strong>{columnName}</strong> :
          <br/>
      }
      {
        ([
          {name: STAT_DESCRIPTORS.RATING_ELO, suffix: ''},
          {name: STAT_DESCRIPTORS.EXPERIENCE_POINTS, suffix: ''},
          {name: STAT_DESCRIPTORS.CULTURE_CONTRIBUTION, suffix: '%'},
          {name: STAT_DESCRIPTORS.TEAM_PLAY, suffix: '%'},
          {name: STAT_DESCRIPTORS.TECHNICAL_HEALTH, suffix: '%'},
          {name: STAT_DESCRIPTORS.ESTIMATION_ACCURACY, suffix: '%'},
          {name: STAT_DESCRIPTORS.ESTIMATION_BIAS, suffix: '%'},
          {name: STAT_DESCRIPTORS.CHALLENGE, suffix: ''},
        ]).map(({name, suffix}, i) => {
          if (columnName === 'Project' && name === STAT_DESCRIPTORS.RATING_ELO) {
            return <div key={i}>{BLANK}</div>
          }

          if (columnName === 'Project' && name === STAT_DESCRIPTORS.EXPERIENCE_POINTS) {
            return <div key={i}>{BLANK}</div>
          }

          if (!columnName) {
            if (columnStats[name]) {
              return <StatDifference key={i} statDiff={columnStats[name]}/>
            }

            return <br key={i}/>
          }
          return (<div key={i}>{renderStat(name, columnStats)}{suffix}</div>)
        })
      }
    </Flex>
  )
}

ProjectStatColumn.propTypes = {
  className: PropTypes.string,
  columnName: PropTypes.string,
  columnStats: PropTypes.shape(userStatsPropType)
}

export default ProjectStatColumn
