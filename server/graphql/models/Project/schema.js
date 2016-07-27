import {GraphQLNonNull, GraphQLID, GraphQLString, GraphQLInt} from 'graphql'
import {GraphQLURL, GraphQLDateTime} from 'graphql-custom-types'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'

import {Chapter, chapterResolver} from '../Chapter/schema'

import {getProjectById} from '../../../../server/db/project'

const projectFields = {
  id: {type: new GraphQLNonNull(GraphQLID), description: "The project's UUID"},
  name: {type: new GraphQLNonNull(GraphQLString), description: 'The project name'},
  chapter: {
    type: Chapter,
    description: 'The chapter',
    resolve: chapterResolver,
  },
  artifactURL: {type: GraphQLURL, description: 'The URL pointing to the output of this project'},
  // Punting on cycleHistory for now
  createdAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was created'},
  updatedAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was last updated'},
}

export const Project = new GraphQLObjectType({
  name: 'Project',
  description: 'A project engaged in by learners to complete some goal',
  fields: () => projectFields,
})

const ProjectReviewResponse = new GraphQLObjectType({
  name: 'ProjectReviewResponse',
  description: 'A named question and response value',
  fields: () => ({
    name: {type: new GraphQLNonNull(GraphQLString), description: 'The question name'},
    value: {type: GraphQLString, description: 'The response to the question'},
  })
})

export const ProjectWithReviewResponses = new GraphQLObjectType({
  name: 'ProjectWithReviewResponses',
  description: 'A project which includes any project review survey responses for the current user',
  fields: () => ({...projectFields,
    projectReviewResponses: {
      type: new GraphQLList(ProjectReviewResponse),
      description: 'The responses to the named questions on the project review survey',
    },
  }),
})

export const ProjectsSummary = new GraphQLObjectType({
  name: 'ProjectsSummary',
  description: 'A summary of project-related information for the player and chapter',
  fields: () => ({
    numActiveProjectsForCycle: {type: new GraphQLNonNull(GraphQLInt), description: 'The number of active projects in the current cycle'},
    numTotalProjectsForPlayer: {type: new GraphQLNonNull(GraphQLInt), description: 'The number of total projects in which the player participated'},
  }),
})

export async function projectResolver(parent /* , args, ast */) {
  if (parent.project) {
    return parent.project
  }

  if (parent.projectId) {
    return await getProjectById(parent.projectId)
  }
}
