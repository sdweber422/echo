import yup from 'yup'

import {VALID_ROLES} from '../util/userCan'

export const inviteCodeSchema = yup.object().shape({
  code: yup.string().required().min(6),
  description: yup.string().required().min(6),
  roles: yup.mixed().oneOf(VALID_ROLES),
})
