import React, {Component, PropTypes} from 'react'
import {Link} from 'react-router'
import moment from 'moment-timezone'

import {Flex} from 'src/common/components/Layout'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {renderGoalAsString} from 'src/common/models/goal'
import {objectValuesAreAllNull, roundDecimal, getStatRenderer} from 'src/common/util'
import ProjectStatColumn from 'src/common/components/UserProjectSummary/ProjectStatColumn'

import styles from './index.scss'

const BLANK = '--'

export default class UserProjectSummary extends Component {
  constructor(props) {
    super(props)
    this.renderSummary = this.renderSummary.bind(this)
    this.renderFeedback = this.renderFeedback.bind(this)
  }

  renderUserProjectStats() {
    const userStats = this.props.userProjectStats || {}
    const {overallStats = {}, statsDifference} = this.props

    const projectStats = {
      ...userStats,
      [STAT_DESCRIPTORS.ELO]: statsDifference[STAT_DESCRIPTORS.ELO],
    }
    const hasStats = userStats ? !objectValuesAreAllNull(userStats) : false
    return hasStats ? ([
      <Flex key="stats" fill>
        <Flex className={styles.column} column>
          <div><em>{'Stat'}</em></div>
          <div>{'Elo'}</div>
          <div>{'XP'}</div>
          <div className={styles.betaStat}>{'XP.v2'}</div>
          <div className={styles.betaStat}>{'XP.v2 Pace'}</div>
          <div>{'Est. Accy.'}</div>
          <div>{'Est. Bias'}</div>
          <div>{'Challenge'}</div>
        </Flex>
        <ProjectStatColumn className={styles.column} columnName={'Project'} columnStats={projectStats}/>
        <ProjectStatColumn className={styles.column} columnName={'Total'} columnStats={overallStats}/>
        <ProjectStatColumn className={styles.column} columnType={'StatDifference'} columnStats={statsDifference} overallStats={overallStats}/>
      </Flex>,
    ]) : <div/>
  }

  renderLevelProgress(statName) {
    const {userProjectStats = {}} = this.props
    const userProjectLevel = userProjectStats[statName] || {}
    const {starting = null, ending = null} = userProjectLevel
    const isBlank = !Number.isFinite(starting)
    const levelProgress = starting === ending ? starting : `${starting} → ${ending}`
    return isBlank ? <span>{BLANK}</span> : <span>{levelProgress}</span>
  }

  renderHoursCompletenessContributionAndLevel() {
    const {project, userProjectStats = {}} = this.props
    const projectHours = (project.stats || {})[STAT_DESCRIPTORS.PROJECT_HOURS] || BLANK
    const renderStat = getStatRenderer(userProjectStats)
    const projectCompleteness = project.stats[STAT_DESCRIPTORS.PROJECT_COMPLETENESS]
    const completenessDiv = Number.isFinite(projectCompleteness) ?
      <div>{roundDecimal(project.stats[STAT_DESCRIPTORS.PROJECT_COMPLETENESS])}% effective completeness</div> :
      ''
    const hasStats = userProjectStats ? !objectValuesAreAllNull(userProjectStats) : false
    return hasStats ? (
      <div>
        <div>{renderStat(STAT_DESCRIPTORS.PROJECT_HOURS)} hours [team total: {roundDecimal(projectHours)}]</div>
        <div>{renderStat(STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION)}% effective contribution</div>
        {completenessDiv}
        <div>Player Level: {this.renderLevelProgress(STAT_DESCRIPTORS.LEVEL)}</div>
        <div className={styles.betaStat}>Player Level.v2: {this.renderLevelProgress(STAT_DESCRIPTORS.LEVEL_V2)}</div>
      </div>
    ) : <div/>
  }

  renderSummary() {
    const {project} = this.props
    const {cycle, goal} = project || {}
    const startDate = cycle.startTimestamp ? moment(cycle.startTimestamp).format('MMM D') : ''
    const endDate = cycle.endTimestamp ? ` - ${moment(cycle.endTimestamp).format('MMM D')}` : ''

    return (
      <Flex className={styles.summary}>
        <Flex className={styles.column} fill column>
          <div>
            <Link className={styles.projectLink} to={`/projects/${project.name}`}>
              <strong>{project.name}</strong>
            </Link>
          </div>
          <div>State: {project.state}</div>
          <div className={styles.goalLine}>{renderGoalAsString(goal)}</div>
          <div>{`${startDate}${endDate}`} [cycle {cycle.cycleNumber}]</div>
          {this.renderHoursCompletenessContributionAndLevel()}
        </Flex>
        {this.renderUserProjectStats()}
      </Flex>
    )
  }

  renderFeedback() {
    const {userProjectEvaluations} = this.props
    const evaluationItems = (userProjectEvaluations || []).filter(evaluation => (
      evaluation[STAT_DESCRIPTORS.GENERAL_FEEDBACK]
    )).map((evaluation, i) => (
      <div key={i} className={styles.evaluation}>
        {evaluation[STAT_DESCRIPTORS.GENERAL_FEEDBACK]}
      </div>
    ))
    return evaluationItems.length > 0 ? (
      <div>
        {evaluationItems}
      </div>
    ) : <div/>
  }

  render() {
    return (
      <Flex className={styles.userProjectSummary} column>
        {this.renderSummary()}
        {this.renderFeedback()}
      </Flex>
    )
  }
}

export const userStatsPropType = {
  [STAT_DESCRIPTORS.CHALLENGE]: PropTypes.number,
  [STAT_DESCRIPTORS.ESTIMATION_ACCURACY]: PropTypes.number,
  [STAT_DESCRIPTORS.ESTIMATION_BIAS]: PropTypes.number,
  [STAT_DESCRIPTORS.EXPERIENCE_POINTS]: PropTypes.number,
  [STAT_DESCRIPTORS.EXPERIENCE_POINTS_V2]: PropTypes.number,
  [STAT_DESCRIPTORS.EXPERIENCE_POINTS_V2_PACE]: PropTypes.number,
  [STAT_DESCRIPTORS.PROJECT_HOURS]: PropTypes.number,
  [STAT_DESCRIPTORS.ELO]: PropTypes.number,
  [STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION]: PropTypes.number,
  [STAT_DESCRIPTORS.RESULTS_FOCUS]: PropTypes.number,
}

UserProjectSummary.propTypes = {
  project: PropTypes.shape({
    name: PropTypes.string,
    cycle: PropTypes.shape({
      cycleNumber: PropTypes.number,
      state: PropTypes.string,
      startTimestamp: PropTypes.date,
      endTimestamp: PropTypes.date,
    }),
    state: PropTypes.string,
    goal: PropTypes.shape({
      number: PropTypes.number,
      title: PropTypes.string,
      level: PropTypes.number,
    }),
    stats: PropTypes.shape({
      [STAT_DESCRIPTORS.PROJECT_COMPLETENESS]: PropTypes.number,
      [STAT_DESCRIPTORS.PROJECT_HOURS]: PropTypes.number,
    }),
  }),
  userProjectEvaluations: PropTypes.arrayOf(PropTypes.shape({
    [STAT_DESCRIPTORS.GENERAL_FEEDBACK]: PropTypes.string,
  })),
  userProjectStats: PropTypes.shape(userStatsPropType),
  overallStats: PropTypes.shape(userStatsPropType),
  statsDifference: PropTypes.shape({
    [STAT_DESCRIPTORS.ELO]: PropTypes.number,
    [STAT_DESCRIPTORS.EXPERIENCE_POINTS]: PropTypes.number,
    [STAT_DESCRIPTORS.EXPERIENCE_POINTS_V2]: PropTypes.number,
    [STAT_DESCRIPTORS.EXPERIENCE_POINTS_V2_PACE]: PropTypes.number,
    [STAT_DESCRIPTORS.ESTIMATION_ACCURACY]: PropTypes.number,
    [STAT_DESCRIPTORS.ESTIMATION_BIAS]: PropTypes.number,
    [STAT_DESCRIPTORS.CHALLENGE]: PropTypes.number
  }),
}
