import bluebird from 'bluebird'
import factoryGirl from 'factory-girl'

import chapterFactoryDefine from './chapter'
import playerFactoryDefine from './player'
import userFactoryDefine from './user'
import cycleFactoryDefine from './cycle'
import voteFactoryDefine from './vote'
import playerGoalRankDefine from './playerGoalRank'

const factory = factoryGirl.promisify(bluebird)
factory.setAdapter(new factory.ObjectAdapter())

chapterFactoryDefine(factory)
playerFactoryDefine(factory)
userFactoryDefine(factory)
cycleFactoryDefine(factory)
voteFactoryDefine(factory)
playerGoalRankDefine(factory)

export default factory
