import r from '../r'

export default function findProjectsToClose() {
  const retrosComplete = ({project, survey}) => survey('completedBy').count().eq(project('playerIds').count())
  const twoWeeksAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 * 2)

  return r.table('projects')
    .filter(_ => r.and(
      _('state').ne('CLOSED'),
      _('createdAt').lt(twoWeeksAgo),
      _('createdAt').gt(new Date(Date.parse('February 26, 2017'))) // cycle 33 and up
    ))
    .eqJoin('retrospectiveSurveyId', r.table('surveys'))
    .filter(_ => retrosComplete({project: _('left'), survey: _('right')}))
    .map(_ => _('left'))
}
