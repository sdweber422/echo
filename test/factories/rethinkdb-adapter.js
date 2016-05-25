const RethinkDBAdapter = function () {}

RethinkDBAdapter.prototype.build = (Model, attributes) => {
  return attributes
}

RethinkDBAdapter.prototype.save = (doc, Model, callback) => {
  return Model.insert(doc, {returnChanges: 'always'}).run(callback)
}

RethinkDBAdapter.prototype.destroy = (doc, Model, callback) => {
  return Model.get(doc.id).delete().run(callback)
}

export default RethinkDBAdapter
