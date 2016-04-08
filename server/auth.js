import express from 'express'

import {
  addUserToRequestFromJWT,
  extendJWTExpiration,
  refreshUserFromIDMService
} from '@learnersguild/idm-jwt-auth/lib/middlewares'

/* eslint new-cap: [2, {"capIsNewExceptions": ["Router"]}] */
const app = express.Router()

// app configuration
app.use(addUserToRequestFromJWT)
app.use(refreshUserFromIDMService)
app.use(extendJWTExpiration)

export default app
