var mongoose = require('mongoose')
var utils = require('../helpers/utils')

var COLLECTION = 'staffs'

var staffSchema = mongoose.Schema(
  {
    staffname: { type: String, required: true },
    state: { type: String, default: '' },
    normalizedStaffname: String,
    normalizedState: String
  },
  { collection: COLLECTION }
)

staffSchema.pre('save', function (next) {
  this.staffname = utils.sanitizeFieldPlainText(this.staffname.trim())
  this.state = utils.sanitizeFieldPlainText((this.state || '').trim())
  this.normalizedStaffname = utils.sanitizeFieldPlainText(this.staffname.toLowerCase().trim())
  this.normalizedState = utils.sanitizeFieldPlainText((this.state || '').toLowerCase().trim())

  return next()
})

staffSchema.statics.getStaffByState = function (state, callback) {
  var query = {}

  if (state) {
    var normalizedState = utils.sanitizeFieldPlainText(state.toLowerCase().trim())
    query = {
      $or: [
        { normalizedState: normalizedState },
        { state: new RegExp('^' + normalizedState + '$', 'i') }
      ]
    }
  }

  var q = this.model(COLLECTION)
    .find(query)
    .sort({ normalizedStaffname: 1, staffname: 1 })
    .lean()

  return q.exec(callback)
}

module.exports = mongoose.model(COLLECTION, staffSchema)
