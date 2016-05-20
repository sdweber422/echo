import 'babel-polyfill'
import jsdom from 'jsdom'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

// environment setup
process.env.RETHINKDB_URL = 'rethinkdb://localhost:28015/game_test'
process.env.CHAT_BASE_URL = 'http://chat.learnersguild.test'
process.env.CHAT_API_USER_SECRET = 'chat'

// jsdom setup
const doc = jsdom.jsdom('<!doctype html><html><body></body></html>')
const win = doc.defaultView
global.__CLIENT__ = false
global.__SERVER__ = true
global.document = doc
global.window = win
global.navigator = win.navigator

// helpers
global.testContext = filename => {
  return filename.slice(1).split('/').reduce((ret, curr) => {
    const currWithoutTests = curr === '__tests__' ? null : `/${curr}`
    const value = ret.useCurr && currWithoutTests ? `${ret.value}${currWithoutTests}` : ret.value
    const useCurr = ret.useCurr || curr === 'game'
    return {useCurr, value}
  }, {useCurr: false, value: ''}).value.replace('.test.js', '').slice(1)
}

// setup chai and make it available in all tests
chai.use(chaiAsPromised)
global.expect = chai.expect

// CSS modules setup
require('../server/configureCSSModules')()
