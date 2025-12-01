const express = require('express')
const router = express.Router()
const {
  getMe,
  createAdmin,
  getAllAdmins,
} = require('../controllers/adminController')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

// Protected routes
router.get('/me', protect, getMe)
// Super Admin only
router.post('/create-admin', protect, authorize('SUPER_ADMIN'), createAdmin)
// GET All Admins
router.get('/all-admins', protect, getAllAdmins)

module.exports = router