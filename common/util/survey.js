import {
  QUESTION_SUBJECT_TYPES,
  QUESTION_RESPONSE_TYPES,
  LIKERT_7_AGREEMENT_OPTIONS,
} from 'src/common/models/survey'

export const QUESTION_GROUP_TYPES = {
  TEAM: 'TEAM',
  USER: 'USER',
}

export const FORM_INPUT_TYPES = {
  TEXT: 'TEXT',
  RADIO: 'RADIO',
  SLIDER_GROUP: 'SLIDER_GROUP',
  NUMERIC: 'NUMERIC',
  PERCENTAGE: 'PERCENTAGE',
}

export function groupSurveyQuestions(questions) {
  try {
    const teamQuestionsByQuestionId = new Map()
    const subjectQuestionsBySubjectId = new Map()

    if (Array.isArray(questions)) {
      questions.forEach(question => {
        let subject
        let subjectGroup
        let subjectQuestions

        switch (question.subjectType) {
          case QUESTION_SUBJECT_TYPES.TEAM:
            // group -> {subjects: [], question: {}}
            teamQuestionsByQuestionId.set(question.id, {
              type: QUESTION_GROUP_TYPES.TEAM,
              subjects: question.subjects,
              question,
            })
            break

          case QUESTION_SUBJECT_TYPES.PROJECT:
          case QUESTION_SUBJECT_TYPES.PLAYER:
            // group -> {subject: {}, questions: []}
            subject = question.subjects[0]
            if (subject) {
              subjectGroup = subjectQuestionsBySubjectId.get(subject.id)
              subjectQuestions = subjectGroup ? subjectGroup.questions : []
              subjectQuestions.push(question)

              subjectQuestionsBySubjectId.set(subject.id, {
                type: QUESTION_GROUP_TYPES.USER,
                questions: subjectQuestions,
                subject,
              })
            } else {
              throw new Error(`Subject not found for question ${question.id}; question skipped`)
            }
            break

          default:
            throw new Error(`Invalid survey question subject type ${question.subjectType}; question skipped`)
        }
      })
    } else {
      throw new Error('Invalid questions value; cannot convert to question groups')
    }

    const teamGroups = Array.from(teamQuestionsByQuestionId.values())
    const subjectGroups = Array.from(subjectQuestionsBySubjectId.values())

    return teamGroups.concat(subjectGroups)
  } catch (err) {
    console.error(err)
    throw new Error('Could not parse survey data.')
  }
}

// transform a question group into an array of form fields to be responded to
export function formFieldsForQuestionGroup(questionGroup) {
  try {
    if (!questionGroup) {
      return null
    }
    switch (questionGroup.type) {
      case QUESTION_GROUP_TYPES.TEAM: {
        const {question, subjects} = questionGroup
        const responses = question.response ? question.response.values : null

        switch (question.responseType) {
          case QUESTION_RESPONSE_TYPES.RELATIVE_CONTRIBUTION: {
            return [{
              title: 'Relative Contribution',
              type: FORM_INPUT_TYPES.SLIDER_GROUP,
              name: question.id,
              label: (question.body || '').trim(),
              hint: (question.responseInstructions || '').trim(),
              options: (subjects || []).map(subject => ({
                key: subject.id,
                label: `@${subject.handle}`,
                tooltip: `@${subject.handle} (${subject.name})`,
                url: subject.profileUrl,
              })),
              value: (responses || []).map(response => ({
                key: response.subjectId,
                value: parseInt(response.value, 10) || 0,
              })),
              validate: Object.assign({required: true}, question.validationOptions || {}),
            }]
          }

          default:
            throw new Error(`Invalid team question response type: ${question.responseType}`)
        }
      }

      case QUESTION_GROUP_TYPES.USER: {
        const {questions, subject} = questionGroup

        return (questions || []).map(question => {
          const response = question.response && question.response.values ? question.response.values[0] : null
          const responseValue = response ? response.value : null

          let title
          switch (question.subjectType) {
            case QUESTION_SUBJECT_TYPES.PLAYER:
              title = `Feedback for @${subject.handle} (${subject.name})`
              break
            case QUESTION_SUBJECT_TYPES.PROJECT:
              title = `#${subject.name}`
              break
            default:
              title = subject.name
          }

          const field = {
            title,
            name: `${question.id}:${subject.id}`,
            label: (question.body || '').trim(),
            hint: (question.responseInstructions || '').trim(),
            validate: Object.assign({required: true}, question.validationOptions || {}),
          }

          switch (question.responseType) {
            case QUESTION_RESPONSE_TYPES.TEXT:
              field.type = FORM_INPUT_TYPES.TEXT
              field.value = responseValue || ''
              break
            case QUESTION_RESPONSE_TYPES.NUMERIC:
              field.type = FORM_INPUT_TYPES.NUMERIC
              field.value = parseInt(responseValue, 10) || null
              break
            case QUESTION_RESPONSE_TYPES.PERCENTAGE:
              field.type = FORM_INPUT_TYPES.PERCENTAGE
              field.value = parseInt(responseValue, 10) || null
              break
            case QUESTION_RESPONSE_TYPES.LIKERT_7:
              field.type = FORM_INPUT_TYPES.RADIO
              field.options = LIKERT_7_AGREEMENT_OPTIONS
              field.value = parseInt(responseValue, 10) || null
              break
            default:
              throw new Error(`Invalid user question response type: ${question.responseType}`)
          }

          return field
        })
      }

      default:
        throw new Error(`Invalid question group type: ${questionGroup.type}`)
    }
  } catch (err) {
    console.error(err)
    throw new Error('Could not parse survey data.')
  }
}

// transform survey form field into question response to be saved
export function questionResponsesForFormFields(formFields, defaults) {
  try {
    if (!formFields) {
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
        case FORM_INPUT_TYPES.NUMERIC:
        case FORM_INPUT_TYPES.PERCENTAGE:
          response.values.push({
            subjectId,
            value: field.value === null ? '' : field.value,
          })
          break

        case FORM_INPUT_TYPES.SLIDER_GROUP:
          (field.value || []).forEach(fieldValue => response.values.push({
            subjectId: fieldValue.key,
            value: fieldValue.value === null ? '' : fieldValue.value,
          }))
          break

        default:
          throw new Error(`Invalid form field type: ${field.type}`)
      }

      return response
    })
  } catch (err) {
    console.error(err)
    throw new Error('Could not parse survey input data.')
  }
}
