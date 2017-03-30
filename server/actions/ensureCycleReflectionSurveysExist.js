import Promise from 'bluebird'

import {saveSurvey} from 'src/server/db/survey'
import {QUESTION_RESPONSE_TYPES, QUESTION_SUBJECT_TYPES} from 'src/common/models/survey'
import {PROJECT_REVIEW_DESCRIPTOR, RETROSPECTIVE_DESCRIPTOR} from 'src/common/models/surveyBlueprint'
import {getActiveQuestionsByIds} from 'src/server/db/question'
import {getSurveyBlueprintByDescriptor} from 'src/server/db/surveyBlueprint'
import {findProjects, updateProject} from 'src/server/db/project'
import {LGBadRequestError} from 'src/server/util/error'

export default function ensureCycleReflectionSurveysExist(cycle) {
  return Promise.all([
    ensureRetrospectiveSurveysExist(cycle),
    ensureProjectReviewSurveysExist(cycle),
  ])
}

export async function ensureProjectReviewSurveysExist(cycle) {
  const projects = await findProjects({chapterId: cycle.chapterId, cycleId: cycle.id})
    .filter(project => project.hasFields('projectReviewSurveyId').not())
  return Promise.map(projects, async project => {
    const projectReviewSurveyId = await buildSurvey(project, PROJECT_REVIEW_DESCRIPTOR)
    return updateProject({id: project.id, projectReviewSurveyId})
  })
}

export function ensureRetrospectiveSurveysExist(cycle) {
  const projects = findProjects({chapterId: cycle.chapterId, cycleId: cycle.id})
    .filter(project => project.hasFields('retrospectiveSurveyId').not())
  return Promise.map(projects, async project => {
    const retrospectiveSurveyId = await buildSurvey(project, RETROSPECTIVE_DESCRIPTOR)
    return updateProject({id: project.id, retrospectiveSurveyId})
  })
}

async function buildSurvey(project, surveyDescriptor) {
  if (projectSurveyExists(project, surveyDescriptor)) {
    throw new LGBadRequestError(`${surveyDescriptor} survey already exists for project ${project.name}.`)
  }

  return await buildSurveyQuestionRefs(project, surveyDescriptor)
    .then(questionRefs => saveSurvey({
      questionRefs,
      completedBy: [],
      unlockedFor: [],
    }))
    .then(result => result.generated_keys[0])
}

function projectSurveyExists(project, surveyDescriptor) {
  return Boolean(project[`${surveyDescriptor}SurveyId`])
}

async function buildSurveyQuestionRefs(project, surveyDescriptor) {
  const surveyBlueprint = await getSurveyBlueprintByDescriptor(surveyDescriptor)
  const questionRefDefaults = surveyBlueprint.defaultQuestionRefs
  if (!questionRefDefaults || questionRefDefaults.length === 0) {
    throw new Error(`No ${surveyDescriptor} questions found!`)
  }

  const getOffset = id => questionRefDefaults.findIndex(ref => ref.questionId === id)
  const sortQuestions = (a, b) => getOffset(a.id) - getOffset(b.id)

  const questionRefDefaultsById = questionRefDefaults
    .reduce((obj, next) => Object.assign({}, obj, {[next.questionId]: next}), {})

  const questions = await getActiveQuestionsByIds(questionRefDefaults.map(({questionId}) => questionId))
  const applicableQuestions = filterProjectSurveyQuestions(project, questions).sort(sortQuestions)
  return mapQuestionsToQuestionRefs(applicableQuestions, project, questionRefDefaultsById, surveyDescriptor)
}

const questionRefBuilders = {
  [PROJECT_REVIEW_DESCRIPTOR]: (question, project) => {
    switch (question.subjectType) {
      case QUESTION_SUBJECT_TYPES.PROJECT:
        return [{
          questionId: question.id,
          subjectIds: [project.id],
        }]

      default:
        throw new Error(`Unsupported default project review survey question type: ${question.subjectType} for question ${question.id}`)
    }
  },

  [RETROSPECTIVE_DESCRIPTOR]: (question, project) => {
    const {playerIds, coachId} = project

    switch (question.subjectType) {
      case QUESTION_SUBJECT_TYPES.TEAM:
        return [{
          questionId: question.id,
          subjectIds: playerIds,
        }]

      case QUESTION_SUBJECT_TYPES.PLAYER:
        return playerIds.map(playerId => ({
          questionId: question.id,
          subjectIds: [playerId],
        }))

      case QUESTION_SUBJECT_TYPES.COACH:
        return [{
          questionId: question.id,
          subjectIds: [coachId],
        }]

      case QUESTION_SUBJECT_TYPES.PROJECT:
        return [{
          questionId: question.id,
          subjectIds: [project.id],
        }]

      default:
        throw new Error(`Unsupported default retrospective survey question type: ${question.subjectType} for question ${question.id}`)
    }
  },
}

function mapQuestionsToQuestionRefs(questions, project, questionRefDefaultsById, surveyDescriptor) {
  const mapQuestionToQuestionRefs = questionRefBuilders[surveyDescriptor]
  return questions
    .map(question => mapQuestionToQuestionRefs(question, project)
      .map(ref => Object.assign({}, ref, questionRefDefaultsById[question.id]))
    )
    .reduce((a, b) => a.concat(b), [])
}

function filterProjectSurveyQuestions(project, questions) {
  const isSinglePersonTeam = project.playerIds.length === 1
  const doesNotHaveCoach = (project.coachId || null) === null
  return isSinglePersonTeam || doesNotHaveCoach ?
    questions.filter(question => !(
      (isSinglePersonTeam && question.responseType === QUESTION_RESPONSE_TYPES.RELATIVE_CONTRIBUTION) ||
      (doesNotHaveCoach && question.subjectType === QUESTION_SUBJECT_TYPES.COACH)
    )) :
    questions
}
