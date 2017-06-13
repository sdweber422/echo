import fs from 'fs'
import minimist from 'minimist'
import {MongoClient} from 'mongodb'

import {Project} from 'src/server/services/dataService'

// -- helper functions (very testable)

function mergedChannelName(channel) {
  switch (channel) {
    case 'game-mechanics':
      return 'los-support'
    case 'significant-updates':
      return 'moderation'
    default:
      return channel
  }
}

function camelToKebab(str) {
  return str
    .replace(/([A-Z])/g, match => `-${match.toLowerCase()}`)
    .replace(/^-/, '')
}

async function getToSlackMessage(projectChannelNames) {
  return doc => {
    const {ts, channelName, username, msg} = doc
    const hasAllFields = (ts && username && msg && channelName)
    if (!hasAllFields || projectChannelNames.has(channelName)) {
      return null
    }
    return {
      timestamp: Math.round(ts.getTime() / 1000),
      channel: camelToKebab(mergedChannelName(channelName)),
      username,
      text: msg.replace(/"/g, '\\"')
    }
  }
}

function toCSV({timestamp, channel, username, text}) {
  return `"${timestamp}","${channel}","${username}","${text}"\n`
}

// -- i/o and database access (not easily testable)

function writeMessagesToMigrate(messageInStream, csvOutStream, toSlackMessage) {
  return new Promise((resolve, reject) => {
    messageInStream.on('data', doc => {
      const slackMessage = toSlackMessage(doc)
      if (slackMessage) {
        csvOutStream.write(toCSV(slackMessage))
      }
    })
    messageInStream.on('error', err => {
      return reject(err)
    })
    messageInStream.on('end', () => {
      return resolve()
    })
  })
}

async function getProjectChannelNames() {
  const projectNames = (await Project.run()).map(p => p.name)
  const projectChannelNames = new Set(projectNames)
  return projectChannelNames
}

function getMessageStream(db, channelType) {
  return db.collection('rocketchat_message')
    .aggregate([{
      $lookup: {
        from: 'rocketchat_room',
        localField: 'rid',
        foreignField: '_id',
        as: 'rooms',
      },
    }, {
      $project: {
        ts: true,
        room: {$arrayElemAt: ['$rooms', 0]},
        username: '$u.username',
        msg: true,
      },
    }, {
      $project: {
        ts: true,
        channelName: '$room.name',
        username: true,
        msg: true,
        channelType: '$room.t',
        channelArchived: {$eq: ['$room.archived', true]},
      },
    }, {
      $match: {
        channelType,
        channelArchived: false,
      },
    }, {
      $sort: {channelName: 1},
    }])
    .stream()
}

// -- main

async function run(mongodbURL, publicFilename, privateFilename) {
  const db = await MongoClient.connect(mongodbURL)
  const publicOutStream = fs.createWriteStream(publicFilename, {
    flags: 'w',
    defaultEncoding: 'utf8',
  })
  const privateOutStream = fs.createWriteStream(privateFilename, {
    flags: 'w',
    defaultEncoding: 'utf8',
  })

  try {
    const projectChannelNames = await getProjectChannelNames()
    const publicInStream = await getMessageStream(db, 'c')
    const privateInStream = await getMessageStream(db, 'p')
    const toSlackMessage = await getToSlackMessage(projectChannelNames)
    await writeMessagesToMigrate(publicInStream, publicOutStream, toSlackMessage)
    await writeMessagesToMigrate(privateInStream, privateOutStream, toSlackMessage)
  } finally {
    db.close()
    publicOutStream.close()
    privateOutStream.close()
  }
}

if (!module.parent) {
  /* eslint-disable unicorn/no-process-exit */
  const args = minimist(process.argv.slice(2), {alias: {help: 'h'}})
  const usage = 'Usage: rocketChatMessagesToSlackCSV MONGODB_URL PUBLIC_CSV_FILENAME PRIVATE_CSV_FILENAME'
  if (args.help) {
    console.info(usage)
    process.exit(0)
  }
  if (args._.length !== 3) {
    console.error('Invalid arguments. Try --help for help.')
    process.exit(1)
  }
  const [mongodbURL, publicFilename, privateFilename] = args._

  run(mongodbURL, publicFilename, privateFilename)
    .then(() => {
      process.exit(0)
    })
    .catch(err => {
      console.error(err.stack || err)
      process.exit(2)
    })
}
