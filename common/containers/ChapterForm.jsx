import React, {Component, PropTypes} from 'react'
import {reduxForm, reset} from 'redux-form'
import moment from 'moment-timezone'

import createOrUpdateChapter from '../actions/createOrUpdateChapter'
import addInviteCodeToChapter from '../actions/addInviteCodeToChapter'
import loadChapter from '../actions/loadChapter'
import ChapterFormComponent from '../components/ChapterForm'
import {chapterFormSchema, validationErrorToReduxFormErrors} from '../validations'

function asyncValidate(values) {
  return new Promise((resolve, reject) => {
    chapterFormSchema.validate(values, {abortEarly: false})
      .then(() => resolve())
      .catch(error => reject(validationErrorToReduxFormErrors(error)))
  })
}

function saveChapter(dispatch) {
  return chapterInfo => {
    dispatch(createOrUpdateChapter(chapterInfo))
  }
}

function createAndAddInviteCode(dispatch) {
  return inviteCodeFormData => {
    const {chapterId, code, description, roles} = inviteCodeFormData
    const inviteCode = {code, description, roles: roles.split(/\W+/)}
    dispatch(reset('inviteCode'))
    dispatch(addInviteCodeToChapter(chapterId, inviteCode))
  }
}

class WrappedChapterForm extends Component {
  componentDidMount() {
    this.constructor.fetchData(this.props.dispatch, this.props)
  }

  static fetchData(dispatch, props) {
    const {params: {id}} = props
    if (id) {
      dispatch(loadChapter(id))
    }
  }

  render() {
    return <ChapterFormComponent {...this.props}/>
  }
}

WrappedChapterForm.propTypes = {
  dispatch: PropTypes.func.isRequired,
}

export default reduxForm({
  form: 'chapter',
  fields: ['id', 'name', 'channelName', 'timezone', 'cycleDuration', 'cycleEpochDate', 'cycleEpochTime'],
  asyncBlurFields: ['name', 'channelName', 'timezone', 'cycleDuration', 'cycleEpochDate', 'cycleEpochTime'],
  asyncValidate,
}, (state, props) => {
  const {id} = props.params
  const {chapters, isBusy} = state.chapters
  const chapter = chapters[id]
  const inviteCodes = chapter && chapter.inviteCodes
  let formType = chapter ? 'update' : 'new'
  if (id && !chapter && !isBusy) {
    formType = 'notfound'
  }
  const timezone = moment.tz.guess()
  const cycleEpochDate = chapter && chapter.cycleEpoch ? new Date(chapter.cycleEpoch) : undefined
  const cycleEpochTime = chapter && chapter.cycleEpoch ? new Date(chapter.cycleEpoch) : undefined
  const initialValues = Object.assign({}, {id, timezone, cycleEpochDate, cycleEpochTime}, chapter)

  return {
    initialValues,
    isBusy,
    formType,
    inviteCodes,
    showCreateInviteCode: true,
    // TODO: upgrade redux-form when this is fixed: https://github.com/erikras/redux-form/issues/621#issuecomment-181898392
  }
}, dispatch => ({
  onSubmit: saveChapter(dispatch),
  onCreateInviteCode: createAndAddInviteCode(dispatch),
}))(WrappedChapterForm)
