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
import {connect} from 'react-redux'
import {push} from 'react-router-redux'
import {reduxForm} from 'redux-form'
import ProgressBar from 'react-toolbox/lib/progress_bar'

import SurveyForm from 'src/common/components/SurveyForm'
import SurveyConfirmation from 'src/common/components/SurveyConfirmation'
import {Flex} from 'src/common/components/Layout'
import {showLoad, hideLoad} from 'src/common/actions/app'
import {
  groupSurveyQuestions,
  formFieldsForQuestionGroup,
  questionResponsesForFormFields,
} from 'src/common/util/survey'
import {
  getRetrospectiveSurvey,
  findRetrospectiveSurveys,
  saveRetroSurveyResponses,
  setSurveyGroup,
} from 'src/common/actions/survey'

import styles from './index.css'

const FORM_NAME = 'retrospectiveSurvey'

class RetroSurveyContainer extends Component {
  constructor(props) {
    super(props)
    this.getRef = this.getRef.bind(this)
    this.handleClose = this.handleClose.bind(this)
    this.handleSave = this.handleSave.bind(this)
    this.handleClickProject = this.handleClickProject.bind(this)
    this.renderProjectList = this.renderProjectList.bind(this)
    this.state = {title: 'Retrospective'}
  }

  componentDidMount() {
    this.props.showLoad()
    this.props.fetchData()
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.isBusy) {
      return
    }
    if (nextProps.loading) {
      this.props.hideLoad()
    }
  }

  getRef(node) {
    this.node = node
  }

  handleClickProject(project) {
    return () => this.props.navigate(`/retro/${project.name}`)
  }

  handleSave(surveyFormValues) {
    try {
      // merge submitted form values with fuller field types
      const mergedFields = this.props.surveyFields.map(field => (
        {...field, value: surveyFormValues[field.name]}
      ))

      const {currentUser, surveyId, surveyGroupIndex} = this.props
      const defaults = {surveyId, respondentId: currentUser.id}
      const responses = questionResponsesForFormFields(mergedFields, defaults)

      return this.props.saveRetroSurveyResponses(responses, {
        onSuccess: () => {
          this.props.setSurveyGroup(surveyGroupIndex + 1)
          if (this.node) {
            this.node.scrollIntoView()
          }
        }
      })
    } catch (err) {
      console.err('Survey response parse error:', err)
    }
  }

  handleClose() {
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage('closeRetroSurvey', '*')
    }
    window.location = '/retro'
  }

  renderHeader() {
    return (
      <Flex flexDirection="column" width="100%" className={styles.header}>
        <div className={styles.headerTitle}>{this.state.title}</div>
        <h6 className={styles.headerSubtitle}>{this.props.surveyTitle}</h6>
        <div className={styles.playbookLink}>
          {'See the'}
          <a href={process.env.PLAYBOOK_URL} target="_blank" rel="noopener noreferrer">
            {' Playbook '}
          </a>
          {'for more info.'}
        </div>
      </Flex>
    )
  }

  renderProgress() {
    const {surveyFieldGroups, surveyGroupIndex} = this.props
    const numTotal = (surveyFieldGroups || []).length
    const numComplete = surveyGroupIndex
    const percentageComplete = numTotal ? (parseInt((numComplete / numTotal) * 100, 10)) : 0

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
    const {isBusy, surveyFields, handleSubmit} = this.props
    if (!isBusy && !surveyFields) {
      return null
    }

    return (
      <SurveyForm
        name={FORM_NAME}
        title={((surveyFields || [])[0] || {}).title}
        fields={surveyFields}
        onSave={this.handleSave}
        handleSubmit={handleSubmit}
        submitLabel="Next"
        disabled={this.props.isBusy}
        invalid={this.props.invalid}
        submitting={this.props.submitting}
        pristine={this.props.pristine}
        />
    )
  }

  renderProjectList() {
    return (
      <div className={styles.projectList}>
        <div className={styles.header}>
          <h5>Available Retrospectives</h5>
        </div>
        <hr className={styles.headerDivider}/>
        <div className={styles.projectListPrompt}>Select a project:</div>
        <div>
          {this.props.projects.map((project, i) => (
            <div key={i} className={styles.projectListItem}>
              {'• '}
              <a href="" onClick={this.handleClickProject(project)}>
                {`${project.name} (cycle ${project.cycle.cycleNumber})`}
              </a>
            </div>
          ))}
        </div>
      </div>
    )
  }

  renderNoActionNeeded() {
    return (
      <div className={styles.empty}>
        <h6>Hooray! You have no pending retrospectives.</h6>
      </div>
    )
  }

  render() {
    if (this.props.showSurvey) {
      return (
        <div className={styles.container} ref={this.getRef}>
          {this.renderHeader()}
          {this.renderProgress()}
          {this.renderSurvey() || this.renderConfirmation()}
        </div>
      )
    }

    if (this.props.showProjects) {
      return this.renderProjectList()
    }

    if (this.props.isBusy) {
      return null
    }

    return this.renderNoActionNeeded()
  }
}

RetroSurveyContainer.propTypes = {
  currentUser: PropTypes.object,
  isBusy: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,

  showSurvey: PropTypes.bool.isRequired,
  surveyId: PropTypes.string,
  surveyTitle: PropTypes.string,
  surveyGroupIndex: PropTypes.number,
  surveyFields: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    label: PropTypes.string,
    hint: PropTypes.string,
    value: PropTypes.any,
    options: PropTypes.array,
    validate: PropTypes.object,
  })),
  surveyFieldGroups: PropTypes.arrayOf(PropTypes.array),
  surveyError: PropTypes.object,

  showProjects: PropTypes.bool.isRequired,
  projects: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    cycle: PropTypes.shape({
      cycleNumber: PropTypes.number,
    }),
  })),

  handleSubmit: PropTypes.func.isRequired,
  fetchData: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  showLoad: PropTypes.func.isRequired,
  hideLoad: PropTypes.func.isRequired,
  saveRetroSurveyResponses: PropTypes.func.isRequired,
  setSurveyGroup: PropTypes.func.isRequired,
  invalid: PropTypes.bool.isRequired,
  submitting: PropTypes.bool.isRequired,
  pristine: PropTypes.bool.isRequired,
}

RetroSurveyContainer.fetchData = fetchData

function fetchData(dispatch, props) {
  if (props.params.projectName) {
    dispatch(getRetrospectiveSurvey(props.params.projectName))
  } else {
    dispatch(findRetrospectiveSurveys())
  }
}

function parseSurvey(survey) {
  if (survey && survey.questions) {
    const surveyQuestionGroups = groupSurveyQuestions(survey.questions)
    if (surveyQuestionGroups) {
      return surveyQuestionGroups.map(questionGroup => (
        formFieldsForQuestionGroup(questionGroup)
      ))
    }
  }
}

function mapStateToProps(state) {
  const {
    surveys: {
      isBusy,
      data: surveys,
      groupIndex: surveyGroupIndex,
    },
  } = state

  let showSurvey = true
  let surveyId = null
  let surveyTitle = null
  let surveyFields = null
  let surveyFieldGroups = null
  let surveyError = null
  let initialValues = null

  let showProjects = false
  let projects = null

  // TODO: make more performant by parsing survey only when data changes
  if (surveys.length === 1) {
    try {
      const survey = surveys[0]
      surveyId = survey.id
      surveyFieldGroups = parseSurvey(survey)
      surveyFields = surveyFieldGroups[surveyGroupIndex]
      surveyTitle = `${survey.project ? `#${survey.project.name}` : ''}${survey.project.cycle ? ` (cycle ${survey.project.cycle.cycleNumber})` : ''}`
      initialValues = surveyFields.reduce((result, field) => {
        result[field.name] = field.value
        return result
      }, {})
    } catch (err) {
      surveyError = err
    }
  } else {
    showSurvey = false
    if (surveys.length > 1) {
      showProjects = true
      projects = surveys.map(r => r.project).sort((p1, p2) => (
        (p1.cycle || {}).cycleNumber - (p2.cycle || {}).cycleNumber
      ))
    }
  }

  return {
    currentUser: state.auth.currentUser,
    loading: state.app.showLoading,
    isBusy,
    showSurvey,
    showProjects,
    projects,
    surveyId,
    surveyTitle,
    surveyFields,
    surveyFieldGroups,
    surveyGroupIndex,
    surveyError,
    initialValues,
  }
}

function mapDispatchToProps(dispatch, props) {
  return {
    fetchData: () => fetchData(dispatch, props),
    showLoad: () => dispatch(showLoad()),
    hideLoad: () => dispatch(hideLoad()),
    navigate: path => dispatch(push(path)),
    saveRetroSurveyResponses: (responses, options) => dispatch(saveRetroSurveyResponses(responses, options)),
    setSurveyGroup: groupIndex => dispatch(setSurveyGroup(groupIndex)),
  }
}

const formOptions = {
  form: FORM_NAME,
  enableReinitialize: true,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(reduxForm(formOptions)(RetroSurveyContainer))
