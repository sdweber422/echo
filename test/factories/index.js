import bluebird from 'bluebird'
import factoryGirl from 'factory-girl'

import chapterFactoryDefine from './chapter'
import playerFactoryDefine from './player'
import playerPoolFactoryDefine from './playerPool'
import moderatorFactoryDefine from './moderator'
import userFactoryDefine from './user'
import cycleFactoryDefine from './cycle'
import voteFactoryDefine from './vote'
import projectFactoryDefine from './project'
import surveyFactoryDefine from './survey'
import surveyBlueprintFactoryDefine from './surveyBlueprint'
import poolFactoryDefine from './pool'
import questionFactoryDefine from './question'
import responseFactoryDefine from './response'
import playerGoalRankFactoryDefine from './playerGoalRank'
import phaseFactoryDefine from './phase'
import feedbackTypeFactoryDefine from './feedbackType'
import RethinkDBAdapter from './RethinkDBAdapter'

const factory = factoryGirl.promisify(bluebird)
factory.setAdapter(new RethinkDBAdapter())

chapterFactoryDefine(factory)
playerFactoryDefine(factory)
playerPoolFactoryDefine(factory)
moderatorFactoryDefine(factory)
userFactoryDefine(factory)
cycleFactoryDefine(factory)
voteFactoryDefine(factory)
projectFactoryDefine(factory)
surveyFactoryDefine(factory)
surveyBlueprintFactoryDefine(factory)
poolFactoryDefine(factory)
questionFactoryDefine(factory)
responseFactoryDefine(factory)
playerGoalRankFactoryDefine(factory)
phaseFactoryDefine(factory)
feedbackTypeFactoryDefine(factory)

export default factory
