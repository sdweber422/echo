/**
 * SurveyForm
 * A dumb component that akes an array of fields, renders an appropriate
 * input for each field's type, and passes a new array of the same fields
 * fields with modified values on submission.
 */
import React, {PropTypes} from 'react'
import Button from 'react-toolbox/lib/button'
import {Field} from 'redux-form'

import {FORM_INPUT_TYPES} from 'src/common/util/survey'

import {Flex} from 'src/common/components/Layout'
import SurveyFormInputText from 'src/common/components/SurveyFormInputText'
import SurveyFormInputNumeric from 'src/common/components/SurveyFormInputNumeric'
import SurveyFormInputRadio from 'src/common/components/SurveyFormInputRadio'
import SurveyFormInputSliderGroup from 'src/common/components/SurveyFormInputSliderGroup'
import {validateText, validateNumber, validateNumberGroup} from 'src/common/validations'

import styles from './index.css'

class SurveyForm extends React.Component {
  constructor(props) {
    super(props)
    this.renderFieldInput = this.renderFieldInput.bind(this)
  }

  handleValidateText(field) {
    return function (value) {
      return validateText(value, field.validate)
    }
  }

  handleValidateNumber(field) {
    return function (value) {
      return validateNumber(value, field.validate)
    }
  }

  handleValidateSliderGroup(field) {
    return function (items) {
      const values = (items || []).map(item => item.value)
      return validateNumberGroup(values, field.validate)
    }
  }

  validateFieldInput(field) {
    if (field) {
      switch (field.type) {
        case FORM_INPUT_TYPES.TEXT:
          return this.handleValidateText(field)
        case FORM_INPUT_TYPES.NUMERIC:
        case FORM_INPUT_TYPES.PERCENTAGE:
        case FORM_INPUT_TYPES.RADIO:
          return this.handleValidateNumber(field)
        case FORM_INPUT_TYPES.SLIDER_GROUP:
          return this.handleValidateSliderGroup(field)
        default:
          return
      }
    }
  }

  renderFieldInput(field) {
    const {input: {onChange: handleChange}} = field
    switch (field.type) {
      case FORM_INPUT_TYPES.TEXT:
        return (
          <SurveyFormInputText
            name={field.name}
            hint={field.hint}
            value={field.input.value || ''}
            onChange={handleChange}
            />
        )

      case FORM_INPUT_TYPES.NUMERIC:
      case FORM_INPUT_TYPES.PERCENTAGE:
        return (
          <SurveyFormInputNumeric
            name={field.name}
            hint={field.hint}
            value={isNaN(field.input.value) ? null : field.input.value}
            onChange={handleChange}
            />
        )

      case FORM_INPUT_TYPES.RADIO:
        return (
          <SurveyFormInputRadio
            name={field.name}
            options={field.options}
            value={isNaN(field.input.value) ? null : field.input.value}
            onChange={handleChange}
            />
        )

      case FORM_INPUT_TYPES.SLIDER_GROUP:
        return (
          <SurveyFormInputSliderGroup
            sum={100}
            name={field.name}
            hint={field.hint}
            options={field.options}
            value={field.input.value || []}
            onChange={handleChange}
            />
        )

      default:
        return null
    }
  }

  renderFields() {
    if (!this.props.fields) {
      return null
    }
    return (
      <Flex flexDirection="column" width="100%" className={styles.body}>
        {this.props.fields.map((field, i) => {
          return (
            <div key={i} className={styles.fieldWrapper}>
              <h6 className={styles.fieldLabel}>{field.label}</h6>
              <Field
                name={field.name}
                component={this.renderFieldInput}
                validate={this.validateFieldInput(field)}
                props={field}
                />
            </div>
          )
        })}
      </Flex>
    )
  }

  render() {
    const {
      name,
      title,
      handleSubmit,
      submitLabel,
      onSave,
      disabled,
      invalid,
      submitting,
    } = this.props
    const disableSubmit = disabled || invalid || submitting
    return (
      <Flex width="100%" flexDirection="column" className={styles.container}>
        <form id={name} onSubmit={handleSubmit(onSave)}>
          <h5>{title || ''}</h5>

          {this.renderFields()}

          <Flex width="100%" justifyContent="flex-end" className={styles.footer}>
            <Button
              type="submit"
              label={submitLabel || 'Submit'}
              disabled={disableSubmit}
              onClick={handleSubmit(onSave)}
              raised
              primary
              />
          </Flex>
        </form>
      </Flex>
    )
  }
}

SurveyForm.propTypes = {
  name: PropTypes.string,
  title: PropTypes.string,
  fields: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    label: PropTypes.string,
    hint: PropTypes.string,
    value: PropTypes.any,
    options: PropTypes.array,
    validate: PropTypes.object,
  })),
  submitLabel: PropTypes.string,
  handleSubmit: PropTypes.func,
  onSave: PropTypes.func,
  disabled: PropTypes.bool,
  invalid: PropTypes.bool,
  submitting: PropTypes.bool,
}

export default SurveyForm
