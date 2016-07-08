global.__CLIENT__ = false
global.__SERVER__ = true
global.__DEVELOPMENT__ = process.env.NODE_ENV === 'development'

/* global __DEVELOPMENT__ */
if (__DEVELOPMENT__) {
  require('dotenv').load()
}

require('./newGameUser').start()
require('./newChapter').start()
require('./newOrUpdatedVote').start()
require('./cycleInitialized').start()
require('./cycleLaunched').start()
require('./cycleReflectionStarted').start()
require('./cycleCompleted').start()
require('./projectArtifactChanged').start()
require('./surveyResponseSubmitted').start()
