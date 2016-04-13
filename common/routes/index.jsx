/* eslint new-cap: [2, {"capIsNewExceptions": ["UserAuthWrapper"]}] */
import React from 'react'
import {Route, IndexRoute} from 'react-router'
import {UserAuthWrapper} from 'redux-auth-wrapper'
import {push} from 'react-router-redux'

import App from '../containers/App'
import BlankLayout from '../containers/BlankLayout'
import Home from '../containers/Home'
import ChapterForm from '../containers/ChapterForm'
import authorizationError from '../actions/authorizationError'

import {userCan} from '../util'

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
const userCanVisit = (capability, store) => {
  return UserAuthWrapper({
    authSelector: state => state.auth.currentUser,
    predicate: currentUser => userCan(currentUser, capability),
    failureRedirectPath: '/',
    allowRedirectBack: false,
    redirectAction: failureRedirectPath => {
      const {dispatch} = store
      dispatch(authorizationError('You are not authorized to do that.'))
      dispatch(push(failureRedirectPath))
      return {type: 'ignore'}
    },
    wrapperDisplayName: 'userCan',
  })
}

const routes = store => {
  // <Route path="/chapters" component={userCan('listChapters')(ChapterList)}/>
  return (
    <Route path="/" component={App}>
      <Route component={BlankLayout}>
        <IndexRoute component={userIsAuthenticated(Home)}/>
        <Route path="/chapters/new" component={userCanVisit('createChapter', store)(userIsAuthenticated(ChapterForm))}/>
        <Route path="/chapters/:id" component={userCanVisit('editChapter', store)(userIsAuthenticated(ChapterForm))}/>
      </Route>
    </Route>
  )
}
export default routes
