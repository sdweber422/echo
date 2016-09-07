import PlayersGotTheirVoteAppraiser from './playersGotTheirVoteAppraiser'

export default class AdvancedPlayersGotTheirVoteAppraiser extends PlayersGotTheirVoteAppraiser {
  constructor(pool, options) {
    super(pool, {...options, advancedPlayersOnly: true})
  }
}
