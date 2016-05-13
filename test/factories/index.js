// import test from 'ava'
import bluebird from 'bluebird'
import factoryGirl from 'factory-girl'

import chapterFactoryDefine from './chapter'
import playerFactoryDefine from './player'
import userFactoryDefine from './user'
import cycleFactoryDefine from './cycle'
import voteFactoryDefine from './vote'
import playerGoalRankDefine from './playerGoalRank'
import RethinkDBAdapter from './rethinkdb-adapter'

const factory = factoryGirl.promisify(bluebird)
factory.setAdapter(new RethinkDBAdapter())

chapterFactoryDefine(factory)
playerFactoryDefine(factory)
userFactoryDefine(factory)
cycleFactoryDefine(factory)
voteFactoryDefine(factory)
playerGoalRankDefine(factory)

export default factory
