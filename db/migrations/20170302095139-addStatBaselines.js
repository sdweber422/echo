import {STAT_DESCRIPTORS} from 'src/common/models/stat'

const {
  PROJECT_REVIEW_ACCURACY,
  EXTERNAL_PROJECT_REVIEW_COUNT,
  INTERNAL_PROJECT_REVIEW_COUNT,
} = STAT_DESCRIPTORS

const PRO_PLAYERS = [
  '070b3063-0ff7-40c6-b3d1-321fa49b6c94', // 'bluemihai'
  'dcf14075-6fbe-44ab-89bf-cba2511f0278', // 'deadlyicon'
  'ed958f6f-1870-4ba9-8de9-e1092c9fa758', // 'deonna'
  '75dbe257-a701-4725-ba74-4341376f540d', // 'jrob8577'
  '1707c1b3-1be7-49ce-b0bd-ab9f289a4795', // 'punitrathore'
  '51430799-d153-4866-adc0-612e0b879bbe', // 'bundacia'
  '3a1599ac-2105-4806-95d7-1bcd3d6a2da7', // 'jeffreywescott'
  '3760fbe8-2c2e-46d9-bca7-a9610dc0d417', // 'prattsj'
  'f490c8ee-e609-4774-bcf5-9ed7f938676d', // 'tannerwelsh'
]

const PRO_PLAYER_BASELINE = {
  [PROJECT_REVIEW_ACCURACY]: 95,
  [EXTERNAL_PROJECT_REVIEW_COUNT]: 10,
  [INTERNAL_PROJECT_REVIEW_COUNT]: 0,
}

exports.up = function (r) {
  return r.table('players')
    .update(player => {
      const statsBaseline = r.branch(
        r.expr(PRO_PLAYERS).contains(player('id')),
        PRO_PLAYER_BASELINE,
        learnerBaseline(player),
      )
      return {statsBaseline, stats: statsBaseline}
    })
}

exports.down = function (r) {
  return r.table('players')
    .update({
      statsBaseline: {
        [PROJECT_REVIEW_ACCURACY]: r.literal(),
        [EXTERNAL_PROJECT_REVIEW_COUNT]: r.literal(),
        [INTERNAL_PROJECT_REVIEW_COUNT]: r.literal(),
      }
    })
}

function learnerBaseline(player) {
  const eloRating = player('stats').default({})('elo').default({})('rating').default(0)
  return {
    [PROJECT_REVIEW_ACCURACY]: eloRating.div(100),
    [EXTERNAL_PROJECT_REVIEW_COUNT]: 0,
    [INTERNAL_PROJECT_REVIEW_COUNT]: 0,
  }
}
