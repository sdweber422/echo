import {repeat} from 'src/server/services/projectFormationService/util'

//
// Given a list of items and a list of partition sizes, return the
// set of all possible partitionings of the items in the list into
// partitions of the given sizes.
//
// TODO: rename to ennumeratePossiblePartitionings or just possiblePartitionings or just partitionings?
// what about the other ennumarate functions?
export function * getPossiblePartitionings(list, partitionSizes, shouldPrunePartitioning, partitioning = []) {
  const [thisPartitionSize, ...otherPartitionSizes] = partitionSizes

  const shouldPruneSubset = subset => {
    if (shouldPrunePartitioning) {
      const partialPartitioning = partitioning.concat([subset])
      return shouldPrunePartitioning(partialPartitioning)
    }
  }

  if (!thisPartitionSize) {
    yield partitioning
    return
  }

  for (const subset of getSubsets(list, thisPartitionSize, shouldPruneSubset)) {
    const newList = list.slice(0)
    subset.forEach(item => {
      newList.splice(newList.indexOf(item), 1)
    })

    yield * getPossiblePartitionings(newList, otherPartitionSizes, shouldPrunePartitioning, partitioning.concat([subset]))
  }
}

// TODO: rename to subsets? or ennumerateNchooseK?
export function * getSubsets(list, subsetSize, shouldPrune) {
  const n = list.length
  const k = subsetSize
  const indexesToValues = indexes => indexes.map(i => list[i])
  const shouldPruneByIndexes = subsetIndexes => shouldPrune && shouldPrune(indexesToValues(subsetIndexes))

  // TODO: find a less memory intensive way to prevent dupes.
  const seen = new Set()
  for (const subsetIndexes of ennumerateNchooseKIndexes(n, k, shouldPruneByIndexes)) {
    const subset = indexesToValues(subsetIndexes)
    const key = subset.toString()

    if (!seen.has(key)) {
      yield subset
    }

    seen.add(key)
  }
}

// Efficient algorithm for getting all the ways to choose some
// number of elements from a list.
//
// From: http://www.cs.colostate.edu/~anderson/cs161/wiki/doku.php?do=export_s5&id=slides:week8
function * ennumerateNchooseKIndexes(n, k, shouldPrune, p = 0, low = 0, subset = []) {
  const high = n - 1 - k + p + 1

  for (let i = low; i <= high; i++) {
    subset[p] = i

    if (shouldPrune && shouldPrune(subset)) {
      continue
    }

    if (p >= k - 1) {
      yield subset.concat()
    } else {
      yield * ennumerateNchooseKIndexes(n, k, shouldPrune, p + 1, i + 1, subset)
    }
  }
}

export function * ennumerateNchooseKwithReplacement(list, k) {
  if (k === 0) {
    yield []
    return
  }

  if (list.length === 1) {
    yield repeat(list[0], k)
    return
  }

  const stars = k
  const bars = list.length - 1
  const tupleLength = stars + bars

  for (const barIndexes of ennumerateNchooseKIndexes(tupleLength, bars)) {
    const combination = []
    const gapBorders = Array.of(-1, ...barIndexes, tupleLength)

    gapBorders.forEach((gapBorder, i) => {
      if (i === 0) {
        return
      }
      const gapSize = gapBorder - gapBorders[i - 1] - 1
      const elements = repeat(gapSize, list[i - 1])
      combination.push(...elements)
    })
    yield combination
  }
}
