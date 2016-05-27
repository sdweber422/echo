import bluebird from 'bluebird'
import factoryGirl from 'factory-girl'

import chapterFactoryDefine from './chapter'
import playerFactoryDefine from './player'
import moderatorFactoryDefine from './moderator'
import userFactoryDefine from './user'
import cycleFactoryDefine from './cycle'
import voteFactoryDefine from './vote'
import projectDefine from './project'
import surveyDefine from './survey'
import questionDefine from './question'
import responseDefine from './response'
import playerGoalRankDefine from './playerGoalRank'
import RethinkDBAdapter from './rethinkdb-adapter'

const factory = factoryGirl.promisify(bluebird)
factory.setAdapter(new RethinkDBAdapter())

chapterFactoryDefine(factory)
playerFactoryDefine(factory)
moderatorFactoryDefine(factory)
userFactoryDefine(factory)
cycleFactoryDefine(factory)
voteFactoryDefine(factory)
projectDefine(factory)
surveyDefine(factory)
questionDefine(factory)
responseDefine(factory)
playerGoalRankDefine(factory)

export default factory
