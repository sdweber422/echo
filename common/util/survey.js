import {
  SURVEY_SUBJECT_TYPES,
  SURVEY_RESPONSE_TYPES,
  LIKERT_7_AGREEMENT_OPTIONS,
} from '../models/survey'

export const FORM_INPUT_TYPES = {
  TEXT: 'TEXT',
  RADIO: 'RADIO',
  SLIDER_GROUP: 'SLIDER_GROUP',
}

export function groupSurveyQuestions(questions) {
  const teamQuestionsByQuestionId = new Map()
  const singleQuestionsBySubjectId = new Map()

  let parseError
  if (Array.isArray(questions)) {
    questions.forEach(question => {
      let subject
      let subjectGroup
      let subjectQuestions

      switch (question.subjectType) {
        case SURVEY_SUBJECT_TYPES.TEAM:
          // group -> {subjects: [], question: {}}
          teamQuestionsByQuestionId.set(question.id, {
            type: SURVEY_SUBJECT_TYPES.TEAM,
            subjects: question.subjects,
            question,
          })
          break

        case SURVEY_SUBJECT_TYPES.PLAYER:
          // group -> {subject: {}, questions: []}
          subject = question.subjects[0]
          if (subject) {
            subjectGroup = singleQuestionsBySubjectId.get(subject.id)
            subjectQuestions = subjectGroup ? subjectGroup.questions : []
            subjectQuestions.push(question)

            singleQuestionsBySubjectId.set(subject.id, {
              type: SURVEY_SUBJECT_TYPES.SINGLE,
              questions: subjectQuestions,
              subject,
            })
          } else {
            parseError = new Error(`Subject not found for question ${question.id}; question skipped`)
          }
          break

        default:
          parseError = new Error(`Invalid survey question subject type ${question.subjectType}; question skipped`)
      }
    })
  } else {
    parseError = new Error('Invalid questions value; cannot convert to question groups')
  }

  if (parseError) {
    console.error(parseError)
  }

  const teamGroups = Array.from(teamQuestionsByQuestionId.values())
  const subjectGroups = Array.from(singleQuestionsBySubjectId.values())

  return teamGroups.concat(subjectGroups)
}

// transform a question group into an array of form fields to be responded to
export function formFieldsForQuestionGroup(questionGroup) {
  if (!questionGroup) {
    return null
  }

  switch (questionGroup.type) {
    case SURVEY_SUBJECT_TYPES.TEAM: {
      const {question, subjects} = questionGroup
      const responses = question.response ? question.response.values : null

      switch (question.responseType) {
        case SURVEY_RESPONSE_TYPES.RELATIVE_CONTRIBUTION: {
          return [{
            title: 'Relative Contribution',
            type: FORM_INPUT_TYPES.SLIDER_GROUP,
            name: question.id,
            label: question.body,
            hint: question.responseInstructions,
            options: (subjects || []).map(subject => ({
              key: subject.id,
              label: subject.handle,
              imageUrl: subject.profileUrl,
            })),
            value: (responses || []).map(response => ({
              key: response.subjectId,
              value: parseInt(response.value, 10) || 0,
            })),
          }]
        }

        default:
          console.error(new Error(`Invalid single subject question response type: ${question.responseType}`))
          return null
      }
    }

    case SURVEY_SUBJECT_TYPES.SINGLE: {
      const {questions, subject} = questionGroup

      return (questions || []).map(question => {
        const response = question.response && question.response.values ? question.response.values[0] : null
        const responseValue = response ? response.value : null

        const field = {
          title: `Feedback for @${subject.handle}`,
          name: `${question.id}:${subject.id}`,
          label: question.body,
          hint: question.responseInstructions,
        }

        switch (question.responseType) {
          case SURVEY_RESPONSE_TYPES.TEXT:
            field.type = FORM_INPUT_TYPES.TEXT
            field.value = responseValue || ''
            break
          case SURVEY_RESPONSE_TYPES.LIKERT_7:
            field.type = FORM_INPUT_TYPES.RADIO
            field.options = LIKERT_7_AGREEMENT_OPTIONS
            field.value = parseInt(responseValue, 10) || 0
            break
          default:
            console.error(new Error(`Invalid single subject question response type: ${question.responseType}`))
            return null
        }

        return field
      })
    }

    default:
      console.error(new Error(`Invalid question group type: ${questionGroup.type}`))
      return null
  }
}

// transform survey form field into question response to be saved
export function questionResponsesForFormFields(formFields, defaults) {
  if (!formFields || !formFields.length) {
    return null
  }

  return formFields.map(field => {
    const [questionId, subjectId] = field.name.split(':')
    const response = Object.assign({}, defaults || {}, {
      questionId,
      values: [],
    })

    switch (field.type) {
      case FORM_INPUT_TYPES.TEXT:
      case FORM_INPUT_TYPES.RADIO:
        response.values.push({
          subjectId,
          value: field.value,
        })
        break

      case FORM_INPUT_TYPES.SLIDER_GROUP:
        (field.value || []).forEach(fieldValue => response.values.push({
          subjectId: fieldValue.key,
          value: fieldValue.value,
        }))
        break

      default:
        console.error(new Error(`Invalid form field type: ${field.type}`))
        return null
    }

    return response
  })
}
