const RethinkDBAdapter = function () {};

RethinkDBAdapter.prototype.build = function(Model, attributes) {
  return attributes;
};

RethinkDBAdapter.prototype.save = function(doc, Model, callback) {

  Model.insert(doc).run()
    .then(() => callback())
    .catch(e => callback(e))
};

RethinkDBAdapter.prototype.destroy = function(doc, Model, callback) {

  Model.get(doc.id).delete().run()
    .then(() => callback())
    .catch(e => callback(e))
};

export default RethinkDBAdapter;
