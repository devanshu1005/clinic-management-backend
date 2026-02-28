// CREATE ADMIN VALIDATION
exports.validateCreateAdmin = (req, res, next) => {
  const { email, adminName, phone, clinicName, location } = req.body

  if (!email || !adminName || !phone || !clinicName || !location) {
    return res.status(400).json({
      success: false,
      error: 'All fields are required: email, adminName, phone, clinicName, location'
    })
  }

  next()
}


// DISABLE ADMIN VALIDATION
exports.validateDisableAdmin = (req, res, next) => {
  const { isActive } = req.body

  if (typeof isActive !== "boolean") {
    return res.status(400).json({
      success: false,
      code: "INVALID_INPUT",
      message: "isActive must be true or false",
    })
  }

  next()
}


// UPDATE PASSWORD VALIDATION
exports.validateUpdatePassword = (req, res, next) => {
  const { newPassword } = req.body

  if (!newPassword) {
    return res.status(400).json({
      success: false,
      error: "New password is required"
    })
  }

  next()
}