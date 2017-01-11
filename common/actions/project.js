import {normalize} from 'normalizr'

import {getGraphQLFetcher} from 'src/common/util'
import queries from './queries'
import schemas from './schemas'
import types from './types'

export function findMyProjects() {
  return _findProjects('findMyProjects')
}

export function findProjects(identifiers) {
  return _findProjects('findProjects', identifiers)
}

function _findProjects(queryName, variables) {
  return {
    types: [
      types.FIND_PROJECTS_REQUEST,
      types.FIND_PROJECTS_SUCCESS,
      types.FIND_PROJECTS_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = queries[queryName](variables)
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data[queryName])
        .then(projects => normalize(projects, schemas.projects))
    },
    payload: {},
  }
}

export function getProject(identifier) {
  return {
    types: [
      types.GET_PROJECT_REQUEST,
      types.GET_PROJECT_SUCCESS,
      types.GET_PROJECT_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = queries.getProject(identifier)
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data.getProject)
        .then(project => normalize(project, schemas.project))
    },
    payload: {},
  }
}

export function getProjectSummary(identifier) {
  return {
    types: [
      types.GET_PROJECT_SUMMARY_REQUEST,
      types.GET_PROJECT_SUMMARY_SUCCESS,
      types.GET_PROJECT_SUMMARY_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = queries.getProjectSummary(identifier)
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data.getProjectSummary)
    },
    payload: {},
  }
}

export function importProject(values) {
  return {
    types: [
      types.IMPORT_PROJECT_REQUEST,
      types.IMPORT_PROJECT_SUCCESS,
      types.IMPORT_PROJECT_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const projectImport = {
        ...values,
        userIdentifiers: ((values.userIdentifiers || '')
          .split(',')
          .map(v => v.trim())
          .filter(v => v)
        )
      }

      const query = queries.importProject(projectImport)
      return getGraphQLFetcher(dispatch, getState().auth)(query)
        .then(graphQLResponse => graphQLResponse.data.importProject)
    },
    payload: {},
    redirect: project => (project && project.name ? `/projects/${project.name}` : '/projects'),
  }
}