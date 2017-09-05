import path from 'path'

import config from 'src/config'

export default function configureWatcher() {
  if (config.server.hotReload) {
    const chokidar = require('chokidar')

    // flush require cache for server code when it changes
    const cwd = path.resolve(__dirname, '..')
    const watcher = chokidar.watch(['client', 'common', 'data', 'server'], {cwd})
    watcher.on('ready', () => {
      watcher.on('all', (operation, path) => {
        console.log(`${operation} ${path} -- clearing module cache from server`)
        Object.keys(require.cache).forEach(id => {
          if (/[/\\]server[/\\]/.test(id)) {
            delete require.cache[id]
          }
        })
      })
    })
  }
}
