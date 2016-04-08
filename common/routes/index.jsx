/* eslint new-cap: [2, {"capIsNewExceptions": ["UserAuthWrapper"]}] */
import React from 'react'
import {Route, IndexRoute} from 'react-router'
import {UserAuthWrapper} from 'redux-auth-wrapper'

import App from '../containers/App'
import BlankLayout from '../containers/BlankLayout'
import Home from '../containers/Home'

const userIsAuthenticated = UserAuthWrapper({
  authSelector: state => state.auth.currentUser,
  redirectAction: () => {
    /* global __DEVELOPMENT__ __CLIENT__ window */
    if (__CLIENT__) {
      const baseURL = __DEVELOPMENT__ ? 'http://idm.learnersguild.dev' : 'https://idm.learnersguild.org'
      window.location.href = `${baseURL}/sign-in?redirect=${encodeURIComponent(window.location.href)}`
    }
    return {type: 'ignore'}
  },
  wrapperDisplayName: 'userIsAuthenticated',
})

const routes = (
  <Route path="/" component={App}>
    <Route component={BlankLayout}>
      <IndexRoute component={userIsAuthenticated(Home)}/>
    </Route>
  </Route>
)

export default routes
