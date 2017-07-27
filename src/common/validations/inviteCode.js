/* eslint-disable no-template-curly-in-string */
import yup from 'yup'

import {ROLES} from 'src/common/util/userCan'

const invalidRoleMessage = `\${path} must be one of the following values: ${ROLES.join(', ')}`

export const inviteCodeSchema = yup.object().shape({
  code: yup.string().required().min(6),
  description: yup.string().required().min(6),
  roles: yup.mixed().test(
    'roles-are-valid',
    invalidRoleMessage,
    function (roles) {
      roles.forEach(role => {
        if (ROLES.indexOf(role) < 0) {
          throw this.createError({message: invalidRoleMessage})
        }
      })
      return true
    }
  )
})
