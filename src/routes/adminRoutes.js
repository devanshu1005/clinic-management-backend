const express = require('express')
const router = express.Router()
const {
  getMe,
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdminInfo,
  updateAdminPassword,
} = require('../controllers/adminController')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

// Protected routes
router.get('/me', protect, getMe)

router.get('/:id', protect, getAdminById)
// Super Admin only
router.post('/create-admin', protect, authorize('SUPER_ADMIN'), createAdmin)
// GET All Admins
router.get('/all-admins', protect, getAllAdmins)
// Update Admin info
router.put('/update/:adminId', protect, authorize('SUPER_ADMIN'), updateAdminInfo)
// Update Admin Password
router.put('/password/:adminId', protect, authorize('SUPER_ADMIN'), updateAdminPassword)

module.exports = router