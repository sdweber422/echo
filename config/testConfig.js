import 'babel-polyfill'
import jsdom from 'jsdom'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

// environment setup
process.env.RETHINKDB_URL = 'rethinkdb://localhost:28015/game_test'

// jsdom setup
const doc = jsdom.jsdom('<!doctype html><html><body></body></html>')
const win = doc.defaultView
global.__CLIENT__ = false
global.__SERVER__ = true
global.document = doc
global.window = win
global.navigator = win.navigator

// setup chai and make it available in all tests
chai.use(chaiAsPromised)
global.expect = chai.expect

// CSS modules setup
require('../server/configureCSSModules')()
