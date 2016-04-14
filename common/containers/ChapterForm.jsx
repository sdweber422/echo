import React, {Component, PropTypes} from 'react'
import {reduxForm} from 'redux-form'
import moment from 'moment-timezone'
import juration from 'juration'

import createOrUpdateChapter from '../actions/createOrUpdateChapter'
import loadChapter from '../actions/loadChapter'
import ChapterFormComponent from '../components/ChapterForm'

function validate({name, cycleDuration, cycleEpochDate, cycleEpochTime}) {
  const errors = {}
  if (!name) {
    errors.name = 'Required'
  } else if (name.length < 3) {
    errors.name = 'Not long enough'
  }
  if (!cycleDuration) {
    errors.cycleDuration = 'Required'
  } else {
    try {
      const durationSecs = juration.parse(cycleDuration)
      if (durationSecs < 300) {
        errors.cycleDuration = 'Must be at least 5 minutes long'
      }
    } catch (err) {
      errors.cycleDuration = 'Must be something like "1 week" or "3 hours"'
    }
  }
  const now = new Date()
  if (!cycleEpochDate) {
    errors.cycleEpochDate = 'Required'
  } else if (cycleEpochDate < now) {
    errors.cycleEpochDate = 'Must be in the future'
  }
  if (!cycleEpochTime) {
    errors.cycleEpochTime = 'Required'
  }

  return errors
}

function saveChapter(dispatch) {
  return chapterInfo => {
    dispatch(createOrUpdateChapter(chapterInfo))
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
  validate,
}, (state, props) => {
  const {id} = props.params
  const {chapters, isBusy} = state.chapters
  const chapter = chapters[id]
  let formType = chapter ? 'update' : 'new'
  if (id && !chapter && !isBusy) {
    formType = 'notfound'
  }
  const timezone = moment.tz.guess()
  const cycleEpochDate = chapter && chapter.cycleEpoch ? new Date(chapter.cycleEpoch) : undefined
  const cycleEpochTime = chapter && chapter.cycleEpoch ? new Date(chapter.cycleEpoch) : undefined
  const initialValues = Object.assign({}, {id, timezone, cycleEpochDate, cycleEpochTime}, chapter)

  return {
    auth: state.auth,
    initialValues,
    isBusy,
    formType,
    // TODO: upgrade redux-form when this is fixed: https://github.com/erikras/redux-form/issues/621#issuecomment-181898392
  }
}, dispatch => ({
  onSubmit: saveChapter(dispatch),
}))(WrappedChapterForm)
