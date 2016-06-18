/* global expect */

export function expectSetEquality(a, b) {
  return expect(unique(a)).to.deep.equal(unique(b))
}

function unique(array) {
  return Array.from(new Set(array)).sort()
}
