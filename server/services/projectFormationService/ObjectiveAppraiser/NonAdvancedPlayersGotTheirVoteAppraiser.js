import PlayersGotTheirVoteAppraiser from './playersGotTheirVoteAppraiser'

export default class NonAdvancedPlayersGotTheirVoteAppraiser extends PlayersGotTheirVoteAppraiser {
  constructor(pool, options) {
    super(pool, {...options, regularPlayersOnly: true})
  }
}
