module.exports = {
  server: {
    secure: true,
    hotReload: false,
    rethinkdb: {
      tableCreation: {
        replicas: 3,
      },
    },
    newrelic: {
      enabled: true,
    },
    crm: {
      enabled: true,
    },
    github: {
      repos: {
        crafts: 'https://github.com/GuildCraftsTesting/web-development-js-testing',
      },
    },
    sockets: {
      host: 'echo.learnersguild.org',
    },
  },

  app: {
    minify: true,
    hotReload: false,
    devTools: false,
    noErrors: false,
  },
}
