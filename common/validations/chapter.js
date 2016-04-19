import yup from 'yup'
import moment from 'moment-timezone'
import juration from 'juration'

const chapterBaseSchema = {
  name: yup.string().required().min(3),
  channelName: yup.string().required().min(3),
  timezone: yup.string().required().test(
    'is-valid-timezone',
    '${path} is not a valid timezone',
    value => moment.tz.names().indexOf(value) >= 0
  ),
  cycleDuration: yup.string().required().test(
    'is-valid-duration',
    '${path} is not a valid duration',
    function (value) {
      let durationSecs
      try {
        durationSecs = juration.parse(value)
      } catch (error) {
        throw this.createError()
      }
      if (durationSecs < 300) {
        throw this.createError({message: '${path} must be at least 5 minutes long'})
      }
      return true
    }
  ),
}

export const chapterFormSchema = yup.object().shape(Object.assign({}, chapterBaseSchema, {
  cycleEpochDate: yup.date().required().min(new Date(), '${path} must be in the future'),
  cycleEpochTime: yup.date().required()

}))

export const chapterSchema = yup.object().shape(Object.assign({}, chapterBaseSchema, {
  cycleEpoch: yup.date().min(new Date(), '${path} must be in the future'),
}))
