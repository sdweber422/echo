import {GraphQLEnumType} from 'graphql/type'

export default new GraphQLEnumType({
  name: 'SubjectTypeEnum',
  values: {
    team: {description: 'A multipart subject requiring responses about each member of a project team'},
    player: {description: 'A player in the game'},
    project: {description: 'A project'},
  }
})
