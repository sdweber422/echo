import {reduxForm} from 'redux-form'

import InviteCodeFormComponent from '../components/InviteCodeForm'

import {inviteCodeSchema, validationErrorToReduxFormErrors} from '../validations'

function asyncValidate(values) {
  const inviteCode = Object.assign({}, values, {roles: values.roles.split(/\W+/)})
  return new Promise((resolve, reject) => {
    inviteCodeSchema.validate(inviteCode, {abortEarly: false})
      .then(() => resolve())
      .catch(error => reject(validationErrorToReduxFormErrors(error)))
  })
}

export default reduxForm({
  form: 'inviteCode',
  fields: ['chapterId', 'code', 'description', 'roles'],
  asyncBlurFields: ['code', 'description', 'roles'],
  asyncValidate,
}, (state, props) => ({
  initialValues: {chapterId: props.chapterId, roles: 'player'},
  isActive: props.isActive,
  onCancel: props.onCancel,
}), (dispatch, props) => ({
  onSubmit: props.onCreate,
}))(InviteCodeFormComponent)
