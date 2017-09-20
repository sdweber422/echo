import herokuService from 'src/server/services/herokuService'
import {stubServiceAPIs} from './util'

const stubbedAPIs = stubServiceAPIs(herokuService, {
  getCollaboratorsForApp: () => Promise.resolve([]),
  removeCollaboratorFromApp: () => Promise.resolve(true),
  removeCollaboratorFromApps: () => Promise.resolve([]),
  addCollaboratorToApp: () => Promise.resolve(true),
  addCollaboratorToApps: () => Promise.resolve([]),
})

export default stubbedAPIs
