import {reduxForm} from 'redux-form'

import InviteCodeFormComponent from '../components/InviteCodeForm'

const VALID_ROLES = ['backoffice', 'player', 'moderator']
function validate({code, description, roles}) {
  const errors = {}
  if (!code) {
    errors.code = 'Required'
  } else if (code.length < 6) {
    errors.code = 'Must be at least 6 characters'
  } else if (!code.match(/^[A-Za-z0-9\-]+$/)) {
    errors.code = 'Alphanumeric characters and hyphens only'
  }
  if (!description) {
    errors.description = 'Required'
  } else if (description.length < 6) {
    errors.description = 'Must be at least 6 characters'
  }
  if (roles) {
    const invalidRoles = []
    roles.split(/\W+/).forEach(role => {
      if (VALID_ROLES.indexOf(role) < 0) {
        invalidRoles.push(role)
      }
    })
    if (invalidRoles.length > 0) {
      errors.roles = `These roles are not valid: ${invalidRoles.join(', ')}`
    }
  }

  return errors
}

export default reduxForm({
  form: 'inviteCode',
  fields: ['chapterId', 'code', 'description', 'roles'],
  validate,
}, (state, props) => ({
  initialValues: {chapterId: props.chapterId, roles: 'player'},
  isActive: props.isActive,
  onCancel: props.onCancel,
}), (dispatch, props) => ({
  onSubmit: props.onCreate,
}))(InviteCodeFormComponent)
