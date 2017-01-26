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
    const startDate = cycle.startTimestamp ? moment(cycle.startTimestamp).format('MMM D') : ''
    const endDate = cycle.endTimestamp ? ` - ${moment(cycle.endTimestamp).format('MMM D')}` : ''
    const blank = '--'
    const projectHours = (project.stats || {})[STAT_DESCRIPTORS.PROJECT_HOURS] || blank
    const userProjectHours = userStats[STAT_DESCRIPTORS.PROJECT_HOURS] || blank

    const renderStat = stat => Number.isFinite(userStats[stat]) ? userStats[stat] : blank

    return (
      <Flex className={styles.summary}>
        <Flex className={styles.column} fill column>
          <div>
            <Link className={styles.projectLink} to={`/projects/${project.name}`}>
              <strong>{project.name}</strong>
            </Link>
          </div>
          <div>State: {cycle.state}</div>
          <div>Goal #{goal.number}: {goal.title}</div>
          <div>{`${startDate}${endDate}`} [cycle {cycle.cycleNumber}]</div>
          <div>{userProjectHours} hours [team total: {projectHours}]</div>
          <div>{userStats[STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION] || blank}% contribution</div>
        </Flex>
        <Flex fill>
          <Flex className={styles.column} column>
            <div><em>{'Stat'}</em></div>
            <div>{'Elo'}</div>
            <div>{'XP'}</div>
            <div>{'Culture'}</div>
            <div>{'Team Play'}</div>
            <div>{'Technical'}</div>
            <div>{'Est. Accy.'}</div>
            <div>{'Est. Bias'}</div>
            <div>{'Challenge'}</div>
          </Flex>
          <Flex className={styles.column} column>
            <div><span>&nbsp;</span></div>
            <div>{renderStat(STAT_DESCRIPTORS.RATING_ELO)}</div>
            <div>{renderStat(STAT_DESCRIPTORS.EXPERIENCE_POINTS)}</div>
            <div>{renderStat(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION)}%</div>
            <div>{renderStat(STAT_DESCRIPTORS.TEAM_PLAY)}%</div>
            <div>{renderStat(STAT_DESCRIPTORS.TECHNICAL_HEALTH)}%</div>
            <div>{renderStat(STAT_DESCRIPTORS.ESTIMATION_ACCURACY)}%</div>
            <div>{renderStat(STAT_DESCRIPTORS.ESTIMATION_BIAS)}%</div>
            <div>{renderStat(STAT_DESCRIPTORS.CHALLENGE)}</div>
          </Flex>
        </Flex>
        <Flex fill>
          <Flex className={styles.column} column>
            <div><em>{'Team Play Feedback'}</em></div>
            <div>{'Focus'}</div>
            <div>{'Friction'}</div>
            <div>{'Leadership'}</div>
            <div>{'Receptiveness'}</div>
          </Flex>
          <Flex className={styles.column} column>
            <div><span>&nbsp;</span></div>
            <div>{renderStat(STAT_DESCRIPTORS.RESULTS_FOCUS)}%</div>
            <div>{renderStat(STAT_DESCRIPTORS.FRICTION_REDUCTION)}%</div>
            <div>{renderStat(STAT_DESCRIPTORS.FLEXIBLE_LEADERSHIP)}%</div>
            <div>{renderStat(STAT_DESCRIPTORS.RECEPTIVENESS)}%</div>
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
