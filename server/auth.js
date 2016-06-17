import express from 'express'

import {
  addUserToRequestFromJWT,
  extendJWTExpiration,
  refreshUserFromIDMService
} from '@learnersguild/idm-jwt-auth/lib/middlewares'

/* eslint babel/new-cap: [2, {"capIsNewExceptions": ["Router"]}] */
const app = new express.Router()

// app configuration
app.use(addUserToRequestFromJWT)
app.use(refreshUserFromIDMService)
app.use(extendJWTExpiration)

export default app
