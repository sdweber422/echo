/* eslint-env mocha */
/* global testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import {
  // groupSurveyQuestions,
  // formFieldsForQuestionGroup,
  // questionResponsesForFormFields,
} from '../survey'

describe(testContext(__filename), function () {
  describe('groupSurveyQuestions', function () {
    it('creates one TEAM question group for each question with response type TEAM')

    it('creates one SINGLE question group per subject for all questions with response type PLAYER')

    it('orders returned survey groups such that all team question groups are placed before single subject question groups')
  })

  describe('formFieldsForQuestionGroup', function () {
    describe('question group type: TEAM, question response type: \'relativeContribution\'', function () {
      it('returns an array containing exactly 1 field object')

      it('field.title = \'Relative Contribution\'')

      it('field.type = \'SLIDER_GROUP\'')

      it('field.name = question.id')

      it('field.label = question.body')

      it('field.hint = question.responseInstructions')

      it('field.options = an array containing 1 slider group option per question subject')

      it('field.value = an array containing 1 slider group option value per response value')
    })

    describe('question group type: TEAM, question response type unrecognized', function () {
      it('throws an error')
    })

    describe('question group type: SINGLE, question response type: \'text\'', function () {
      it('returns an array containing 1 field object per question')

      it('field.title = \'Feedback for @[subject.handle]\'')

      it('field.type = \'TEXT\'')

      it('field.name = question.id + \':\' + subject.id')

      it('field.label = question.body')

      it('field.hint = question.responseInstructions')

      it('field.value = question.response.values[0].value')
    })

    describe('question group type: SINGLE, question response type: \'likert7Agreement\'', function () {
      it('returns an array containing 1 field object per question')

      it('field.title = \'Feedback for @[subject.handle]\'')

      it('field.type = \'TEXT\'')

      it('field.name = question.id + \':\' + subject.id')

      it('field.label = question.body')

      it('field.hint = question.responseInstructions')

      it('field.value = question.response.values[0].value if integer, else 0')

      it('field.options = likert 7 agreement options')
    })

    describe('question group type: SINGLE, question response type unrecognized', function () {
      it('throws an error for any other response type')
    })

    it('returns fields in the same corresponding order as the questions in the provided group')
  })

  describe('questionResponsesForFormFields', function () {
    describe('it returns an array containing one question response per form field', function () {
      describe('field type: TEXT', function () {
        it('response.questionId = substring of field.name before \':\'')

        it('response.values = an array containing exactly 1 element; value = field.value; subjectId = substring of field.name after \':\'')
      })

      describe('field type: RADIO', function () {
        it('response.questionId = substring of field.name before \':\'')

        it('response.values = an array containing exactly 1 element; value = field.value; subjectId = substring of field.name after \':\'')
      })

      describe('field type: SLIDER_GROUP', function () {
        it('response.questionId = substring of field.name before \':\'')

        it('response.values = an array containing exactly 1 element for each field.value element; value = field.value[n].value; subjectId = field.value[n].key')
      })

      it('throws an error for any other response type')
    })
  })
})
