import bluebird from 'bluebird'
import factoryGirl from 'factory-girl'

import chapterFactoryDefine from './chapter'
import playerFactoryDefine from './player'
import userFactoryDefine from './user'

const factory = factoryGirl.promisify(bluebird)
factory.setAdapter(new factory.ObjectAdapter())

chapterFactoryDefine(factory)
playerFactoryDefine(factory)
userFactoryDefine(factory)

export default factory
