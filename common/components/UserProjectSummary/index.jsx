import React, {Component, PropTypes} from 'react'
import {Link} from 'react-router'
import moment from 'moment-timezone'

import {Flex} from 'src/common/components/Layout'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'

import styles from './index.scss'

export default class UserProjectSummary extends Component {
  constructor(props) {
    super(props)
    this.renderSummary = this.renderSummary.bind(this)
    this.renderFeedback = this.renderFeedback.bind(this)
  }

  renderSummary() {
    const {project} = this.props
    const {cycle, goal} = project || {}
    const userStats = this.props.userProjectStats || {}
    const startDate = cycle.startTimestamp ? moment(cycle.startTimestamp).format('MMM D, YYYY') : ''
    const endDate = cycle.endTimestamp ? ` - ${moment(cycle.endTimestamp).format('MMM D, YYYY')}` : ''
    const projectHours = (project.stats || {})[STAT_DESCRIPTORS.PROJECT_HOURS]
    const userProjectHours = userStats[STAT_DESCRIPTORS.PROJECT_HOURS]
    const hideHours = isNaN(parseInt(projectHours, 10)) || isNaN(parseInt(userProjectHours, 10))
    const blank = '--'
    return (
      <Flex className={styles.summary}>
        <Flex className={styles.column} fill column>
          <div>
            <Link className={styles.projectLink} to={`/projects/${project.name}`}>
              <strong>{project.name}</strong>
            </Link>
          </div>
          <div>{goal.title}</div>
          <div>{`${startDate}${endDate}`}</div>
          <div>{hideHours ? 'No hours logged' : `${userProjectHours} of ${projectHours} total hours`}</div>
          <div>{cycle.state}</div>
        </Flex>
        <Flex fill>
          <Flex className={styles.column} column>
            <div>{'XP'}</div>
            <div>{'Rating'}</div>
            <div>{'Contribution'}</div>
            <div>{'Culture'}</div>
            <div>{'Technical'}</div>
          </Flex>
          <Flex className={styles.column} column>
            <div>{userStats[STAT_DESCRIPTORS.EXPERIENCE_POINTS] || blank}</div>
            <div>{userStats[STAT_DESCRIPTORS.RATING_ELO] || blank}</div>
            <div>{userStats[STAT_DESCRIPTORS.CULTURE_CONTRIBUTION] || blank}</div>
            <div>{userStats[STAT_DESCRIPTORS.CULTURE_CONTRIBUTION] || blank}</div>
            <div>{userStats[STAT_DESCRIPTORS.TECHNICAL_HEALTH] || blank}</div>
          </Flex>
        </Flex>
        <Flex fill>
          <Flex className={styles.column} column>
            <div>{'Team Play'}</div>
            <div>{'Focus'}</div>
            <div>{'Friction'}</div>
            <div>{'Leadership'}</div>
            <div>{'Receptiveness'}</div>
          </Flex>
          <Flex className={styles.column} column>
            <div>{userStats[STAT_DESCRIPTORS.TEAM_PLAY] || blank}</div>
            <div>{userStats[STAT_DESCRIPTORS.RESULTS_FOCUS] || blank}</div>
            <div>{userStats[STAT_DESCRIPTORS.FRICTION_REDUCTION] || blank}</div>
            <div>{userStats[STAT_DESCRIPTORS.FLEXIBLE_LEADERSHIP] || blank}</div>
            <div>{userStats[STAT_DESCRIPTORS.RECEPTIVENESS] || blank}</div>
          </Flex>
        </Flex>
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
    return (
      <div>
        {evaluationItems.length > 0 ? evaluationItems : (
          <div className={styles.evaluation}>
            {'No feedback.'}
          </div>
        )}
      </div>
    )
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

UserProjectSummary.propTypes = {
  project: PropTypes.shape({
    name: PropTypes.string,
    cycle: PropTypes.shape({
      cycleNumber: PropTypes.number,
      state: PropTypes.string,
      startTimestamp: PropTypes.date,
      endTimestamp: PropTypes.date,
    }),
    goal: PropTypes.shape({
      title: PropTypes.string,
    }),
    stats: PropTypes.shape({
      [STAT_DESCRIPTORS.PROJECT_COMPLETENESS]: PropTypes.number,
      [STAT_DESCRIPTORS.PROJECT_QUALITY]: PropTypes.number,
      [STAT_DESCRIPTORS.PROJECT_HOURS]: PropTypes.number,
    }),
  }),
  userProjectEvaluations: PropTypes.arrayOf(PropTypes.shape({
    [STAT_DESCRIPTORS.GENERAL_FEEDBACK]: PropTypes.string,
  })),
  userProjectStats: PropTypes.shape({
    [STAT_DESCRIPTORS.CULTURE_CONTRIBUTION]: PropTypes.number,
    [STAT_DESCRIPTORS.EXPERIENCE_POINTS]: PropTypes.number,
    [STAT_DESCRIPTORS.FLEXIBLE_LEADERSHIP]: PropTypes.number,
    [STAT_DESCRIPTORS.FRICTION_REDUCTION]: PropTypes.number,
    [STAT_DESCRIPTORS.PROJECT_HOURS]: PropTypes.number,
    [STAT_DESCRIPTORS.RATING_ELO]: PropTypes.number,
    [STAT_DESCRIPTORS.RECEPTIVENESS]: PropTypes.number,
    [STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION]: PropTypes.number,
    [STAT_DESCRIPTORS.RESULTS_FOCUS]: PropTypes.number,
    [STAT_DESCRIPTORS.TEAM_PLAY]: PropTypes.number,
    [STAT_DESCRIPTORS.TECHNICAL_HEALTH]: PropTypes.number,
  }),
}
