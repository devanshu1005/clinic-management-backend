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
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

// Public routes
router.post('/super-admin/login', superAdminLogin) // Super admin login
router.post('/login', login)
router.post('/send-otp', sendOTP)
router.post('/verify-otp', verifyOTP)
router.post('/reset-password', resetPassword)

// Protected routes
router.get('/me', protect, getMe)

// Super Admin only
router.post('/create-admin', protect, authorize('SUPER_ADMIN'), createAdmin)

module.exports = router