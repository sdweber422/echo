/* eslint-disable react/jsx-handler-names */
import React, {Component, PropTypes} from 'react'
import {Button} from 'react-toolbox/lib/button'
import {Field} from 'redux-form'

import ContentHeader from 'src/common/components/ContentHeader'
import NotFound from 'src/common/components/NotFound'
import {Flex} from 'src/common/components/Layout'
import {FORM_TYPES, renderInput} from 'src/common/util/form'

class ProjectForm extends Component {
  render() {
    const {
      pristine,
      handleSubmit,
      submitting,
      invalid,
      formType,
      onSave,
      project,
    } = this.props

    if (formType === FORM_TYPES.NOT_FOUND) {
      return <NotFound/>
    }

    const submitDisabled = Boolean(pristine || submitting || invalid)
    const title = formType === FORM_TYPES.CREATE ?
      'Create Project' :
      `Edit Project${project ? `: ${project.name}` : ''}`

    return (
      <Flex column>
        <ContentHeader title={title}/>
        <form id="project" onSubmit={handleSubmit(onSave)}>
          <Field name="projectIdentifier" type="hidden" component="hidden"/>
          <Field
            name="chapterIdentifier"
            type="text"
            icon="home"
            label="Chapter Name"
            hint={'e.g. "Oakland"'}
            component={renderInput}
            required
            />
          <Field
            name="cycleIdentifier"
            type="text"
            icon="access_time"
            label="Cycle Number"
            hint={'e.g. "21"'}
            component={renderInput}
            required
            />
          <Field
            name="goalIdentifier"
            type="text"
            icon="track_changes"
            label="Goal Number"
            hint={'e.g. "77"'}
            component={renderInput}
            required
            />
          <Field
            name="playerIdentifiers"
            type="text"
            icon="people"
            hint={'Separate by commas (e.g. "ltuhura, mrspock, scotty")'}
            label="Player Handles"
            component={renderInput}
            required
            />
          <Field
            name="coachIdentifier"
            type="text"
            icon="people"
            hint={'e.g. "cptkirk"'}
            label="Coach Handle"
            component={renderInput}
            />
          <Flex justifyContent="flex-end">
            <Button
              type="submit"
              label="Save"
              disabled={submitDisabled}
              primary
              raised
              />
          </Flex>
        </form>
      </Flex>
    )
  }
}

ProjectForm.propTypes = {
  pristine: PropTypes.bool.isRequired,
  invalid: PropTypes.bool.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
  formType: PropTypes.oneOf(Object.values(FORM_TYPES)).isRequired,
  onSave: PropTypes.func.isRequired,
  project: PropTypes.object,
}

export default ProjectForm
