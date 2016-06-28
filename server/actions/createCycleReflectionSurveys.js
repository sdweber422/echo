import {saveSurvey, getProjectSurvey} from '../../server/db/survey'
import {SURVEY_BLUEPRINT_DESCRIPTORS} from '../../common/models/surveyBlueprint'
import {getActiveQuestionsByIds} from '../../server/db/question'
import {
  getTeamPlayerIds,
  getProjectsForChapter,
  setProjectReviewSurveyForCycle,
  setRetrospectiveSurveyForCycle,
} from '../../server/db/project'
import {getSurveyBlueprintByDescriptor} from '../../server/db/surveyBlueprint'

export default function createCycleReflectionSurveys(cycle) {
  return Promise.all([
    createRetrospectiveSurveys(cycle),
    createProjectReviewSurveys(cycle),
  ])
}

export function createProjectReviewSurveys(cycle) {
  return getProjectsForChapter(cycle.chapterId)
    .then(projects => Promise.all(
      projects.map(project => buildSurvey(project, cycle.id, SURVEY_BLUEPRINT_DESCRIPTORS.projectReview)
        .then(surveyId => setProjectReviewSurveyForCycle(project.id, cycle.id, surveyId))
    )))
}

export function createRetrospectiveSurveys(cycle) {
  return getProjectsForChapter(cycle.chapterId)
    .then(projects => Promise.all(
      projects.map(project => buildSurvey(project, cycle.id, SURVEY_BLUEPRINT_DESCRIPTORS.retrospective)
        .then(surveyId => setRetrospectiveSurveyForCycle(project.id, cycle.id, surveyId))
    )))
}

async function buildSurvey(project, cycleId, surveyDescriptor) {
  try {
    await getProjectSurvey(project.id, cycleId, surveyDescriptor)
  } catch (err) {
    if (err.name !== 'ReqlUserError') {
      throw (err)
    }
    return await buildSurveyQuestionRefs(project, cycleId, surveyDescriptor)
      .then(questionRefs => saveSurvey({
        questionRefs,
        completedBy: [],
      }))
      .then(result => result.generated_keys[0])
  }

  throw new Error(`${surveyDescriptor} survey already exists for project ${project.name} cycle ${cycleId}.`)
}

function buildSurveyQuestionRefs(project, cycleId, surveyDescriptor) {
  return getSurveyBlueprintByDescriptor(surveyDescriptor)
    .then(surveyBlueprint => {
      const questionRefDefaults = surveyBlueprint.defaultQuestionRefs
      if (!questionRefDefaults || !questionRefDefaults.length) {
        throw new Error(`No ${surveyDescriptor} questions found!`)
      }
      return getActiveQuestionsByIds(questionRefDefaults.map(({questionId}) => questionId))
        .then(questions => {
          return mapQuestionsToQuestionRefs(questions, project, cycleId, surveyDescriptor)
        })
    })
}

const questionRefBuilders = {
  [SURVEY_BLUEPRINT_DESCRIPTORS.projectReview]: (question, project /* , cycleId */) => {
    switch (question.subjectType) {
      case 'project':
        return {
          questionId: question.id,
          subject: project.id,
        }

      default:
        throw new Error(`Unsupported default project review survey question type: ${question.subjectType} for question ${question.id}`)
    }
  },

  [SURVEY_BLUEPRINT_DESCRIPTORS.retrospective]: (question, project, cycleId) => {
    const teamPlayerIds = getTeamPlayerIds(project, cycleId)

    switch (question.subjectType) {
      case 'team':
        return [{
          questionId: question.id,
          subject: teamPlayerIds
        }]

      case 'player':
        return teamPlayerIds.map(playerId => ({
          questionId: question.id,
          subject: playerId
        }))

      default:
        throw new Error(`Unsupported default retrospective survey question type: ${question.subjectType} for question ${question.id}`)
    }
  },
}

function mapQuestionsToQuestionRefs(questions, project, cycleId, surveyDescriptor) {
  const mapQuestionToQuestionRefs = questionRefBuilders[surveyDescriptor]
  return questions
    .map(question => mapQuestionToQuestionRefs(question, project, cycleId))
    .reduce((a, b) => a.concat(b), [])
}

