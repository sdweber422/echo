import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {reduxForm} from 'redux-form'

import {showLoad, hideLoad} from 'src/common/actions/app'
import {findUsers, updateUser} from 'src/common/actions/user'
import {findPhases} from 'src/common/actions/phase'
import {userSchema, asyncValidate} from 'src/common/validations'
import UserForm from 'src/common/components/UserForm'
import {findAny} from 'src/common/util'
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
    return <UserForm {...this.props}/>
  }
}

UserFormContainer.propTypes = {
  project: PropTypes.object,
  isBusy: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  fetchData: PropTypes.func.isRequired,
  showLoad: PropTypes.func.isRequired,
  hideLoad: PropTypes.func.isRequired,
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
  const {app, users, phases} = state
  const user = findAny(users.users, identifier, ['id', 'handle'])

  const sortedPhases = Object.values(phases.phases).sort((p1, p2) => p1.number - p2.number)
  const sortedPhaseOptions = sortedPhases.map(phaseToOption)

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
