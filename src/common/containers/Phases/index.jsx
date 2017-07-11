import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'
import {Link} from 'react-router'

import TabbedContentTable from 'src/common/components/TabbedContentTable'
import {showLoad, hideLoad} from 'src/common/actions/app'
import {findUsers} from 'src/common/actions/user'
import {findPhasesWithProjects} from 'src/common/actions/phase'

const ProjectModel = {
  project: {type: String},
  goalTitle: {title: 'Goal', type: String},
  hasArtifact: {title: 'Artifact?', type: String},
  memberHandles: {title: 'Members', type: String},
}

class PhaseListContainer extends Component {
  constructor(props) {
    super(props)
    this.state = {selectedTabIndex: 0}
    this.handleSelectTab = this.handleSelectTab.bind(this)
  }

  componentDidMount() {
    this.props.showLoad()
    this.props.fetchData()
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.isBusy && nextProps.loading) {
      this.props.hideLoad()
    }
  }

  handleSelectTab(tabIndex) {
    const currentState = this.state
    currentState.selectedTabIndex = tabIndex
    this.setState(currentState)
  }

  render() {
    const {isBusy, projects, tabs} = this.props
    const selectedTabIndex = this.state.selectedTabIndex
    const source = isBusy ? null : projects[selectedTabIndex]
    return isBusy ? null : (
      <TabbedContentTable
        title="Phases"
        model={ProjectModel}
        tabs={tabs}
        selectedTabIndex={selectedTabIndex}
        source={source}
        onSelectTab={this.handleSelectTab}
        onClickImport={this.handleClickImport}
        />
    )
  }
}

PhaseListContainer.propTypes = {
  tabs: PropTypes.array.isRequired,
  users: PropTypes.object.isRequired,
  projects: PropTypes.array.isRequired,
  isBusy: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  currentUser: PropTypes.object.isRequired,
  fetchData: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  showLoad: PropTypes.func.isRequired,
  hideLoad: PropTypes.func.isRequired,
}

PhaseListContainer.fetchData = fetchData

function fetchData(dispatch) {
  dispatch(findUsers())
  dispatch(findPhasesWithProjects())
}

function mapStateToProps(state) {
  const {app, auth, users, phases} = state
  const {users: usersById} = users
  const {phases: phasesById} = phases
  const phaseList = Object.values(phasesById)
  phaseList.sort((a, b) => a.number - b.number)
  const tabNames = phaseList.map(phase => 'Phase ' + phase.number)

  const projectsByPhase = phaseList.map(phase => {
    return phase.currentProjects.map(project => {
      const members = project.memberIds.map(id => usersById[id].name)
      const projectLink =
        (
          <Link key={project.id} to={`/projects/${project.name}`}>
            {project.name}
          </Link>
        )

      return {
        project: projectLink,
        goalTitle: project.goal.title,
        hasArtifact: project.artifactURL,
        memberHandles: members
      }
    })
  })
  return {
    isBusy: phases.isBusy || users.isBusy,
    loading: app.showLoading,
    users: usersById,
    currentUser: auth.currentUser,
    phases: phaseList,
    projects: projectsByPhase,
    tabs: tabNames
  }
}

function mapDispatchToProps(dispatch) {
  return {
    navigate: path => dispatch(push(path)),
    showLoad: () => dispatch(showLoad()),
    hideLoad: () => dispatch(hideLoad()),
    fetchData: props => {
      return () => fetchData(dispatch, props)
    },
  }
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  const stateAndOwnProps = {...stateProps, ...ownProps}
  return {
    ...dispatchProps,
    ...stateAndOwnProps,
    fetchData: dispatchProps.fetchData(stateAndOwnProps),
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(PhaseListContainer)
