require('./worker').start()

// file watch & reload
require('src/server/configureWatcher')()
