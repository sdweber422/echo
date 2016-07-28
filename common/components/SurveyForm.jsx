/**
 * SurveyForm
 * A dumb component that akes an array of fields, renders an appropriate
 * input for each field's type, and passes a new array of the same fields
 * fields with modified values on submission.
 */
import React, {PropTypes} from 'react'
import Button from 'react-toolbox/lib/button'

import {FORM_INPUT_TYPES} from '../util/survey'

import {Flex} from './Layout'
import SurveyFormInputText from './SurveyFormInputText'
import SurveyFormInputRadio from './SurveyFormInputRadio'
import SurveyFormInputSliderGroup from './SurveyFormInputSliderGroup'

import styles from './SurveyForm.css'

class SurveyForm extends React.Component {
  constructor(props) {
    super(props)
    this.handleFieldChange = this.handleFieldChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.state = {
      form: new Map()
    }
  }

  componentDidMount() {
    this.mergeFields(this.props.fields)
  }

  componentWillReceiveProps(newProps) {
    this.mergeFields(newProps.fields)
  }

  mergeFields(newFields) {
    // TODO: improve perf by comparing old + new fields before merging
    if (newFields) {
      // merge default field values from props
      // and local form field values
      const {form: oldForm} = this.state
      const newForm = new Map()

      newFields.forEach(field => {
        const newFormField = Object.assign({}, field)
        const oldFormField = oldForm.get(field.name)
        if (oldFormField && typeof oldFormField.value !== 'undefined') {
          newFormField.value = oldFormField.value
        }
        newForm.set(field.name, newFormField)
      })

      this.setState({form: newForm})
    }
  }

  getFormFields() {
    return Array.from(this.state.form.values())
  }

  handleFieldChange(name, value) {
    const oldFormField = this.state.form.get(name)
    if (oldFormField) {
      oldFormField.value = value
    }
    this.setState({form: new Map(this.state.form)})
  }

  handleSubmit(event) {
    event.preventDefault()

    if (this.props.onSubmit) {
      this.props.onSubmit(this.getFormFields())
    }
  }

  renderFieldInput(field) {
    switch (field.type) {
      case FORM_INPUT_TYPES.TEXT:
        return (
          <SurveyFormInputText
            name={field.name}
            hint={field.hint}
            value={field.value}
            onChange={this.handleFieldChange}
            />
        )

      case FORM_INPUT_TYPES.RADIO:
        return (
          <SurveyFormInputRadio
            name={field.name}
            options={field.options}
            value={field.value}
            onChange={this.handleFieldChange}
            />
        )

      case FORM_INPUT_TYPES.SLIDER_GROUP:
        return (
          <SurveyFormInputSliderGroup
            sum={100}
            name={field.name}
            hint={field.hint}
            options={field.options}
            value={field.value}
            onChange={this.handleFieldChange}
            />
        )

      default:
        return null
    }
  }

  renderFields() {
    return (
      <Flex flexDirection="column" width="100%" className={styles.body}>
        {this.getFormFields().map((field, i) => (
          <div key={i} className={styles.fieldWrapper}>
            <h6 className={styles.fieldLabel}>{field.label}</h6>
            {this.renderFieldInput(field)}
          </div>
        ))}
      </Flex>
    )
  }

  render() {
    return (
      <Flex width="100%" flexDirection="column" className={styles.container}>
        <form onSubmit={this.handleSubmit}>
          <h5 className={styles.title}>
            {this.props.title || ''}
          </h5>

          {this.renderFields()}

          <Flex width="100%" justifyContent="flex-end" className={styles.footer}>
            <Button
              type="submit"
              label={this.props.submitLabel || 'Submit'}
              disabled={this.props.disabled}
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
  title: PropTypes.string,
  fields: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.required,
    type: PropTypes.string.required,
    label: PropTypes.string,
    hint: PropTypes.string,
    value: PropTypes.any,
    options: PropTypes.array,
    payload: PropTypes.any,
  })),
  onSubmit: PropTypes.func,
  submitLabel: PropTypes.string,
  onClose: PropTypes.func,
  closeLabel: PropTypes.string,
  disabled: PropTypes.bool,
}

export default SurveyForm
