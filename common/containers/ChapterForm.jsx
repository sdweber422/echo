import {reduxForm} from 'redux-form'
import moment from 'moment-timezone'
import juration from 'juration'

import createOrUpdateChapter from '../actions/createOrUpdateChapter'
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

export default reduxForm({
  form: 'chapter',
  fields: ['id', 'name', 'channelName', 'timezone', 'cycleDuration', 'cycleEpochDate', 'cycleEpochTime'],
  validate,
}, state => ({
  auth: state.auth,
  initialValues: {
    timezone: moment.tz.guess(),
    // cycle eopch date and time both set to cycle epoch from state
  }, // TODO: upgrade redux-form when this is fixed: https://github.com/erikras/redux-form/issues/621#issuecomment-181898392
}), dispatch => ({
  onSubmit: saveChapter(dispatch),
}))(ChapterFormComponent)
