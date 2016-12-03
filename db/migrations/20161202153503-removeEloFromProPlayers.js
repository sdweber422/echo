import {findPlayersByIds} from 'src/server/db/player'
import {checkForWriteErrors} from 'src/server/db/util'

const PRO_PLAYER_IDS = [
  '070b3063-0ff7-40c6-b3d1-321fa49b6c94', // bluemihai
  'dcf14075-6fbe-44ab-89bf-cba2511f0278', // deadlyicon
  'ed958f6f-1870-4ba9-8de9-e1092c9fa758', // deonna
  '75dbe257-a701-4725-ba74-4341376f540d', // jrob8577
  '1707c1b3-1be7-49ce-b0bd-ab9f289a4795', // punitrathore'

  // we'll do LOS team, as well, since some of us have stats data
  '51430799-d153-4866-adc0-612e0b879bbe', // bundacia
  '3a1599ac-2105-4806-95d7-1bcd3d6a2da7', // jeffreywescott
  '3760fbe8-2c2e-46d9-bca7-a9610dc0d417', // prattsj
  'b8eb1d79-96e4-409e-a5d1-0f02247603de', // shereefb
  'f490c8ee-e609-4774-bcf5-9ed7f938676d', // tannerwelsh
]

export function up(r, conn) {
  console.warn('This migration is destructive, and therefore irreversible')

  return findPlayersByIds(PRO_PLAYER_IDS)
    // replace instead of update, which does a deep merge
    .replace(player => {
      return player
        // remove the old stats attribute
        .without('stats')
        .merge({
          stats: player('stats')
            .default({})
            // remove elo and the old projects attribute
            .without('elo', 'projects')
            .merge({
              // convert projects to an array
              projects: player('stats')('projects')
                .default({})
                .keys()
                .map(key => player('stats')('projects')(key)
                  // remove elo attribute and add id attribute
                  .without('elo').merge({id: key})
                )
                // convert back to an object
                .fold({}, (result, project) => {
                  // remove the id attribute
                  return result.merge(r.object(project('id'), project.without('id')))
                })
            })
        })
    })
    .run(conn)
    .then(checkForWriteErrors)
}

export function down(/* r, conn */) {
  console.error('Cannot undo this migration because it was destructive.')
}
