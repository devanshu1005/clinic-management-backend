const express = require('express')
const router = express.Router()
const {
  login,
  sendOTP,
  verifyOTP,
  resetPassword,
  getMe,
  createAdmin,
  superAdminLogin
} = require('../controllers/authController')
// Public routes
router.post('/super-admin/login', superAdminLogin) // Super admin login
router.post('/login', login)
router.post('/send-otp', sendOTP)
router.post('/verify-otp', verifyOTP)
router.post('/reset-password', resetPassword)

module.exports = router