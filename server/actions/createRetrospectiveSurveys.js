import {saveSurvey, getProjectRetroSurvey} from '../../server/db/survey'
import {getQuestionsByIds} from '../../server/db/question'
import {getProjectsForChapter} from '../../server/db/project'
import {getRetrospectiveSurveyBlueprint} from '../../server/db/surveyBlueprint'

export default function createRetrospectiveSurveys(cycle) {
  return getProjectsForChapter(cycle.chapterId)
    .then(projects => Promise.all(
      projects.map(project => buildProjectRetroSurvey(project, cycle.id))
    ))
}

async function buildProjectRetroSurvey(project, cycleId) {
  try {
    await getProjectRetroSurvey(project.id, cycleId)
  } catch (err) {
    return await buildSurveyQuestionRefs(project, cycleId)
      .then(questionRefs => saveSurvey({
        projectId: project.id,
        cycleId,
        questionRefs
      }))
  }

  throw new Error(`Project retrospective survey already exists for project ${project.name} cycle ${cycleId}.`)
}

function buildSurveyQuestionRefs(project, cycleId) {
  return getRetrospectiveSurveyBlueprint()
    .then(surveyBlueprint => {
      const questionIds = surveyBlueprint.defaultQuestionIds
      if (!questionIds || !questionIds.length) {
        throw new Error('No retrospective questions found!')
      }
      return getQuestionsByIds(questionIds)
        .then(questions => {
          const refs = mapQuestionsToQuestionRefs(questions, project, cycleId)
          return sortRefs(refs, questions)
        })
    })
}

function mapQuestionsToQuestionRefs(questions, project, cycleId) {
  return questions
    .map(question => mapQuestionToQuestionRefs(question, project, cycleId))
    .reduce((a, b) => a.concat(b), [])
}

function mapQuestionToQuestionRefs(question, project, cycleId) {
  const teamIds = project.cycleTeams[cycleId].playerIds

  switch (question.subjectType) {
    case 'team':
      return [{
        questionId: question.id,
        subject: teamIds
      }]

    case 'player':
      return teamIds.map(playerId => ({
        questionId: question.id,
        subject: playerId
      }))

    default:
      throw new Error(`Unsupported default retrospetive survey question type: ${question.subjectType} for question ${question.id}`)
  }
}

function sortRefs(refs, questionList) {
  const questions = questionList.reduce((map, q) => Object.assign(map, {[q.id]: q}), {})

  const compareBySubject = (a, b) => {
    if (a.subject > b.subject) {
      return 1
    }
    if (a.subject < b.subject) {
      return -1
    }
    return 0
  }

  const compareBySubjectType = (a, b) => {
    const subjectTypeA = questions[a.questionId].subjectType
    const subjectTypeB = questions[b.questionId].subjectType

    if (subjectTypeA < subjectTypeB) {
      return 1
    }
    if (subjectTypeA > subjectTypeB) {
      return -1
    }
    return 0
  }

  return refs.sort((a, b) => {
    return compareBySubjectType(a, b) || compareBySubject(a, b)
  })
}
