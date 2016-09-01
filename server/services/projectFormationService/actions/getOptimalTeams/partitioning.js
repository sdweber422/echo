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

// TODO: rename to subsets?
export function * getSubsets(list, subsetSize, shouldPrune) {
  const n = list.length
  const k = subsetSize
  const indexesToValues = indexes => indexes.map(i => list[i])
  const shouldPruneByIndexes = subsetIndexes => shouldPrune && shouldPrune(indexesToValues(subsetIndexes))

  for (const subsetIndexes of ennumerateNchooseK(n, k, shouldPruneByIndexes)) {
    yield indexesToValues(subsetIndexes)
  }
}

// Efficient algorithm for getting all the ways to choose some
// number of elements from a list.
//
// From: http://www.cs.colostate.edu/~anderson/cs161/wiki/doku.php?do=export_s5&id=slides:week8
function * ennumerateNchooseK(n, k, shouldPrune, p = 0, low = 0, subset = []) {
  const high = n - 1 - k + p + 1

  for (let i = low; i <= high; i++) {
    subset[p] = i

    if (shouldPrune && shouldPrune(subset)) {
      continue
    }

    if (p >= k - 1) {
      yield subset.concat()
    } else {
      yield * ennumerateNchooseK(n, k, shouldPrune, p + 1, i + 1, subset)
    }
  }
}
