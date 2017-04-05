import r from '../r'
import getStatByDescriptor from './getStatByDescriptor'

export default function findQuestionsByStat(statDescriptor) {
  return r.table('questions').filter({
    statId: getStatByDescriptor(statDescriptor)('id')
  })
}
