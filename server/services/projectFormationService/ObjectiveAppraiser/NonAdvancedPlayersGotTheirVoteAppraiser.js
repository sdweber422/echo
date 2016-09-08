import {
  getNonAdvancedPlayerIds,
} from '../pool'

import PlayersGotTheirVoteAppraiser from './playersGotTheirVoteAppraiser'

export default class NonAdvancedPlayersGotTheirVoteAppraiser extends PlayersGotTheirVoteAppraiser {
  constructor(pool, options) {
    super(pool, options, getNonAdvancedPlayerIds(pool))
  }
}
