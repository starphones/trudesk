var StaffSchema = require('../../../models/staff')

var apiStaffs = {}

apiStaffs.get = function (req, res) {
  var state = req.query.state

  StaffSchema.getStaffByState(state, function (err, staffs) {
    if (err) return res.status(500).json({ success: false, error: err.message })

    return res.json({
      success: true,
      staffs: staffs
    })
  })
}

module.exports = apiStaffs
