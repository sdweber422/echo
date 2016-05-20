import animal from 'animal-id'

export function generateNewProjectName() {
  return animal.getId()
}
