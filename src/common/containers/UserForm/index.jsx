import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {reduxForm} from 'redux-form'

import {showLoad, hideLoad} from 'src/common/actions/app'
import {
  findUsers,
  updateUser,
  deactivateUser,
  reactivateUser,
} from 'src/common/actions/user'
import {findPhases} from 'src/common/actions/phase'
import {userSchema, asyncValidate} from 'src/common/validations'
import UserForm from 'src/common/components/UserForm'
import {findAny, userCan} from 'src/common/util'
import {FORM_TYPES} from 'src/common/util/form'

const FORM_NAME = 'user'

class UserFormContainer extends Component {
  componentDidMount() {
    this.props.showLoad()
    this.props.fetchData()
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.isBusy && nextProps.loading) {
      this.props.hideLoad()
    }
  }

  render() {
    if (!this.props.project && this.props.isBusy) {
      return null
    }

    const {user, currentUser} = this.props

    const canBeDeactivated = Boolean(user) && user.active === true && userCan(currentUser, 'deactivateUser')
    const canBeReactivated = Boolean(user) && user.active === false && userCan(currentUser, 'reactivateUser')

    return <UserForm {...this.props} canBeDeactivated={canBeDeactivated} canBeReactivated={canBeReactivated}/>
  }
}

UserFormContainer.propTypes = {
  project: PropTypes.object,
  isBusy: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  fetchData: PropTypes.func.isRequired,
  showLoad: PropTypes.func.isRequired,
  hideLoad: PropTypes.func.isRequired,
  user: PropTypes.object,
  currentUser: PropTypes.object,
  onDeactivateUser: PropTypes.func.isRequired,
  onReactivateUser: PropTypes.func.isRequired,
}

UserFormContainer.fetchData = fetchData

function fetchData(dispatch, props) {
  if (props.params.identifier) {
    dispatch(findUsers([props.params.identifier]))
    dispatch(findPhases())
  }
}

function handleSubmit(dispatch) {
  return values => {
    return dispatch(updateUser(values))
  }
}

function mapStateToProps(state, props) {
  const {identifier} = props.params
  const {app, users, phases, auth} = state
  const user = findAny(users.users, identifier, ['id', 'handle'])

  const sortedPhases = Object.values(phases.phases).sort((p1, p2) => p1.number - p2.number)
  const sortedPhaseOptions = [
    {value: null, label: 'No Phase'}, ...sortedPhases.map(phaseToOption)
  ]

  let formType = FORM_TYPES.UPDATE
  if (identifier && !user && !users.isBusy) {
    formType = FORM_TYPES.NOT_FOUND
  }

  const initialValues = user ? {
    id: user.id,
    phaseNumber: user.phase ? user.phase.number : null,
  } : null

  return {
    isBusy: users.isBusy,
    loading: app.showLoading,
    phaseOptions: sortedPhaseOptions,
    formType,
    user,
    initialValues,
    currentUser: auth.currentUser,
  }
}

function phaseToOption(phase) {
  return {value: phase.number, label: phase.number}
}

function mapDispatchToProps(dispatch, props) {
  return {
    onSave: handleSubmit(dispatch),
    fetchData: () => fetchData(dispatch, props),
    showLoad: () => dispatch(showLoad()),
    hideLoad: () => dispatch(hideLoad()),
    onDeactivateUser: id => dispatch(deactivateUser(id)),
    onReactivateUser: id => dispatch(reactivateUser(id)),
  }
}

const formOptions = {
  form: FORM_NAME,
  enableReinitialize: true,
  asyncBlurFields: ['phaseNumber'],
  asyncValidate: asyncValidate(userSchema, {abortEarly: false}),
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(reduxForm(formOptions)(UserFormContainer))
