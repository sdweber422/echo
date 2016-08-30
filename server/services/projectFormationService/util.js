export function range(start, length) {
  return Array.from(Array(length), (x, i) => i + start)
}

// https://en.wikipedia.org/wiki/Combination
export function choose(n, k) {
  if (k === 0) {
    return 1
  }
  return (n * choose(n - 1, k - 1)) / k
}

export function shuffle(array) {
  let currentIndex = array.length

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    const randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1

    // And swap it with the current element.
    const temporaryValue = array[currentIndex]
    array[currentIndex] = array[randomIndex]
    array[randomIndex] = temporaryValue
  }

  return array
}
