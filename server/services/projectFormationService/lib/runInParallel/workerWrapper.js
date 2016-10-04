global.__SERVER__ = true

require("babel-register")
require("babel-polyfill")

const Worker = require("./Worker")

Worker.start({
  lib: process.argv[2],
  id: process.argv[3],
})
