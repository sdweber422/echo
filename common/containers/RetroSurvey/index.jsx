/* global window */
/**
 * RetroSurvey
 * Controls the following:
 *   - fetching of survey data
 *   - transformation of (deeply nested) survey data to flat survey field collections
 *   - iteration through survey question groups ("pages")
 *   - transformation of flat field collections into survey responses
 *   - submitted survey data persistence
 */
import React, {Component, PropTypes} from 'react'
import ReactDom from 'react-dom'
import {bindActionCreators} from 'redux'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'
import ProgressBar from 'react-toolbox/lib/progress_bar'

import {
  groupSurveyQuestions,
  formFieldsForQuestionGroup,
  questionResponsesForFormFields,
} from 'src/common/util/survey'

import * as SurveyActions from 'src/common/actions/survey'
import SurveyForm from 'src/common/components/SurveyForm'
import SurveyConfirmation from 'src/common/components/SurveyConfirmation'
import {Flex} from 'src/common/components/Layout'

import styles from './index.css'

class RetroSurveyContainer extends Component {
  constructor(props) {
    super(props)
    this.handleClose = this.handleClose.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.renderProjectList = this.renderProjectList.bind(this)
    this.handleClickProject = this.handleClickProject.bind(this)
    this.state = {
      title: 'Retrospective',
      questionGroups: null,
      questionGroupIndex: 0,
      currentSurveyFields: null,
    }
  }

  componentDidMount() {
    const {params: {projectName}, surveyActions} = this.props
    if (projectName) {
      surveyActions.getRetrospectiveSurvey(projectName)
    } else {
      surveyActions.findRetrospectiveSurveys()
    }
  }

  componentWillReceiveProps(nextProps) {
    const {isBusy, error, groupIndex} = nextProps
    const {questionGroups, questionGroupIndex} = this.state

    if (isBusy || error) {
      return
    } else if (!questionGroups) {
      this.parseSurvey(nextProps)
    } else if (groupIndex === questionGroupIndex) {
      this.moveToNextQuestionGroup()
    }
  }

  parseSurvey(nextProps) {
    const {survey} = nextProps

    if (survey && survey.questions) {
      const questionGroups = groupSurveyQuestions(survey.questions)

      let currentSurveyFields
      try {
        currentSurveyFields = formFieldsForQuestionGroup(questionGroups[0])
      } catch (err) {
        return this.props.surveyActions.surveyParseFailure(err)
      }

      this.setState({questionGroups, currentSurveyFields})
    }
  }

  moveToNextQuestionGroup() {
    // if updates for group index set in the store have successfully completed,
    // increment the index by 1 to move to the next question group
    const {questionGroups, questionGroupIndex} = this.state
    const nextGroupIndex = questionGroupIndex + 1
    const nextGroup = questionGroups[nextGroupIndex]
    let nextSurveyFields

    try {
      nextSurveyFields = formFieldsForQuestionGroup(nextGroup)
    } catch (err) {
      return this.props.surveyActions.surveyParseFailure(err)
    }

    this.setState({
      questionGroupIndex: nextGroupIndex,
      currentSurveyFields: nextSurveyFields,
    })

    ReactDom.findDOMNode(this).scrollIntoView()
  }

  handleClickProject(project) {
    return () => this.props.dispatch(push(`/retro/${project.name}`))
  }

  handleSubmit(surveyFormFields) {
    const {currentUser, survey, surveyActions} = this.props
    const defaults = {surveyId: survey.id, respondentId: currentUser.id}

    let responses
    try {
      responses = questionResponsesForFormFields(surveyFormFields, defaults)
    } catch (err) {
      return this.props.surveyActions.surveyParseFailure(err)
    }

    surveyActions.saveRetroSurveyResponses(responses, {groupIndex: this.state.questionGroupIndex})
  }

  handleClose() {
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage('closeRetroSurvey', '*')
    }
    window.location = '/retro'
  }

  renderHeader() {
    const {survey = {}} = this.props
    const subtitle = `${survey.project ? `#${survey.project.name}` : ''}${survey.project.cycle ? ` (cycle ${survey.project.cycle.cycleNumber})` : ''}`

    return (
      <Flex flexDirection="column" width="100%" className={styles.header}>
        <div className={styles.headerTitle}>{this.state.title}</div>
        <h6 className={styles.headerSubtitle}>{subtitle}</h6>
        <div className={styles.playbookLink}>See the <a href={process.env.PLAYBOOK_URL} target="_blank">Playbook</a> for more info.</div>
      </Flex>
    )
  }

  renderProgress() {
    const {questionGroups, questionGroupIndex} = this.state
    const numQuestionGroups = questionGroups.length
    const numComplete = questionGroupIndex
    const percentageComplete = numQuestionGroups ? (parseInt((numComplete / numQuestionGroups) * 100, 10)) : 0

    return (
      <Flex flexDirection="column" width="100%">
        <ProgressBar mode="determinate" value={percentageComplete}/>
        <Flex justifyContent="flex-end" width="100%">{`${percentageComplete}% complete`}</Flex>
      </Flex>
    )
  }

  renderConfirmation() {
    return (
      <SurveyConfirmation label="Close" onClose={this.handleClose}/>
    )
  }

  renderSurvey() {
    const {isBusy} = this.props
    const {currentSurveyFields} = this.state
    if (!currentSurveyFields && !isBusy) {
      return null
    }

    return (
      <SurveyForm
        title={(currentSurveyFields[0] || {}).title}
        fields={currentSurveyFields}
        onChange={this.handleUpdate}
        onSubmit={this.handleSubmit}
        onClose={this.handleClose}
        submitLabel="Next"
        disabled={isBusy}
        />
    )
  }

  renderProjectList() {
    return (
      <div>
        <div className={styles.projectListHeader}>
          Complete a project retrospective:
        </div>
        <div>
          {this.props.projects.map((project, i) => (
            <div key={i} className={styles.projectListItem}>
              <a href="" className={styles.link} onClick={this.handleClickProject(project)}>{project.name}</a>
            </div>
          ))}
        </div>
      </div>
    )
  }

  renderNoSurveys() {
    return (
      <Flex justifyContent="center" alignItems="center">
        <h6>Hooray! You have no pending retrospectives.</h6>
      </Flex>
    )
  }

  render() {
    const {isBusy, projects, survey} = this.props
    if (survey) {
      return (
        <div className={styles.container}>
          {this.renderHeader()}
          {this.renderProgress()}
          {this.renderSurvey() || this.renderConfirmation()}
        </div>
      )
    }

    if (projects.length > 1) {
      return this.renderProjectList()
    }

    if (isBusy) {
      return <ProgressBar mode="indeterminate"/>
    }

    return this.renderNoSurveys()
  }
}

RetroSurveyContainer.propTypes = {
  params: PropTypes.object.isRequired,
  isBusy: PropTypes.bool.isRequired,
  currentUser: PropTypes.object,
  error: PropTypes.object,
  groupIndex: PropTypes.number,
  projects: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    cycle: PropTypes.shape({
      cycleNumber: PropTypes.number,
    }),
  })),
  survey: PropTypes.shape({
    id: PropTypes.string,
    project: PropTypes.shape({
      name: PropTypes.string,
      cycle: PropTypes.shape({
        cycleNumber: PropTypes.number,
      }),
    }),
    questions: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      body: PropTypes.string,
      subjects: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string,
        handle: PropTypes.string,
        profileUrl: PropTypes.string,
      })),
      responseType: PropTypes.string,
      responseInstructions: PropTypes.string,
      response: PropTypes.shape({
        values: PropTypes.arrayOf(PropTypes.shape({
          subjectId: PropTypes.string.isRequired,
          value: PropTypes.any.isRequired,
        }))
      }),
    })),
  }),
  surveyActions: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
}

const mapStateToProps = state => {
  const {auth, surveys} = state
  return {
    currentUser: auth.currentUser,
    error: surveys.error,
    isBusy: surveys.isBusy,
    groupIndex: surveys.groupIndex,
    survey: surveys.retro.length === 1 ? surveys.retro[0] : null,
    projects: surveys.retro.map(r => r.project),
  }
}

const mapDispatchToProps = dispatch => {
  return {
    dispatch,
    surveyActions: bindActionCreators(SurveyActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(RetroSurveyContainer)
