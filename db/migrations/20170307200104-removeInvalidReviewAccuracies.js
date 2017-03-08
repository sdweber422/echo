import {STAT_DESCRIPTORS} from 'src/common/models/stat'

const {
  PROJECT_REVIEW_ACCURACY,
  ELO,
  EXTERNAL_PROJECT_REVIEW_COUNT,
} = STAT_DESCRIPTORS

exports.up = function (r) {
  return r.table('players')
  .filter(row => r.and(
    row('stats').hasFields(PROJECT_REVIEW_ACCURACY),
    row('stats').hasFields(EXTERNAL_PROJECT_REVIEW_COUNT),
    row('stats')(EXTERNAL_PROJECT_REVIEW_COUNT).lt(8)
  ))
  .update({stats: {projectReviewAccuracy: r.literal()}})
}

exports.down = function (r) {
  return r.table('players')
  .filter(row => r.and(
    row('stats').hasFields(EXTERNAL_PROJECT_REVIEW_COUNT),
    row('stats')(EXTERNAL_PROJECT_REVIEW_COUNT).lt(8)
  ))
  .update(player => {
    const eloRating = player('stats').default({})(ELO).default({})('rating').default(0)
    return {stats: {projectReviewAccuracy: eloRating.div(100)}}
  })
}
