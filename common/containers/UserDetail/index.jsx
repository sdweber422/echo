import React, {Component, PropTypes} from 'react'
import {push} from 'react-router-redux'
import {connect} from 'react-redux'

import {showLoad, hideLoad} from 'src/common/actions/app'
import {getUserSummary, deactivateUser} from 'src/common/actions/user'
import {findProjectsForCoach} from 'src/common/actions/project'
import UserDetail from 'src/common/components/UserDetail'

class UserDetailContainer extends Component {
  constructor(props) {
    super(props)
    this.handleSelectProjectRow = this.handleSelectProjectRow.bind(this)
    this.handleSelectCoachedProjectRow = this.handleSelectCoachedProjectRow.bind(this)
  }

  componentDidMount() {
    const {showLoad, fetchData} = this.props
    showLoad()
    fetchData()
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.isBusy && nextProps.loading) {
      this.props.hideLoad()
    }
  }

  handleSelectProjectRow(rowIndex) {
    const {userProjectSummaries} = this.props || []
    const project = userProjectSummaries[rowIndex] || {}
    const projectDetailUrl = `/projects/${project.name}`
    this.props.navigate(projectDetailUrl)
  }

  handleSelectCoachedProjectRow(rowIndex) {
    this.props.navigate(`/projects/${this.props.coachedProjects[rowIndex].name}`)
  }

  render() {
    const {user, navigate, currentUser, onDeactivateUser, userProjectSummaries, coachedProjects} = this.props
    return user ? (
      <UserDetail
        user={user}
        navigate={navigate}
        currentUser={currentUser}
        onDeactivateUser={onDeactivateUser}
        userProjectSummaries={userProjectSummaries}
        onSelectProjectRow={this.handleSelectProjectRow}
        coachedProjects={coachedProjects}
        onSelectCoachedProjectRow={this.handleSelectCoachedProjectRow}
        />
    ) : null
  }
}

UserDetailContainer.propTypes = {
  user: PropTypes.object,
  currentUser: PropTypes.object,
  userProjectSummaries: PropTypes.array,
  coachedProjects: PropTypes.array,
  isBusy: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  fetchData: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  showLoad: PropTypes.func.isRequired,
  hideLoad: PropTypes.func.isRequired,
  onDeactivateUser: PropTypes.func.isRequired,
}

UserDetailContainer.fetchData = fetchData

function fetchData(dispatch, props) {
  dispatch(getUserSummary(props.params.identifier))
  dispatch(findProjectsForCoach(props.params.identifier))
}

function mapStateToProps(state, ownProps) {
  const {identifier} = ownProps.params
  const {userSummaries, auth, projects} = state
  const {coachedProjects: projectsById} = projects
  const {userSummaries: userSummariesByUserId} = userSummaries

  // sort by cycle, title, name
  const projectList = Object.values(projectsById).sort((p1, p2) => {
    return (((p2.cycle || {}).cycleNumber || 0) - ((p1.cycle || {}).cycleNumber || 0)) ||
      (((p1.goal || {}).title || '').localeCompare((p2.goal || {}).title || '')) ||
      p1.name.localeCompare(p2.name)
  })

  const userSummary = Object.values(userSummariesByUserId).find(userSummary => {
    return userSummary.user && (
      userSummary.user.handle === identifier ||
        userSummary.user.id === identifier
    )
  }) || {}

  return {
    user: userSummary.user,
    userProjectSummaries: userSummary.userProjectSummaries,
    coachedProjects: projectList,
    isBusy: userSummaries.isBusy,
    loading: state.app.showLoading,
    currentUser: auth.currentUser,
  }
}

function mapDispatchToProps(dispatch, props) {
  return {
    fetchData: () => fetchData(dispatch, props),
    navigate: path => dispatch(push(path)),
    showLoad: () => dispatch(showLoad()),
    hideLoad: () => dispatch(hideLoad()),
    onDeactivateUser: id => dispatch(deactivateUser(id)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(UserDetailContainer)
