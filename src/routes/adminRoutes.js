const express = require('express')
const router = express.Router()
const {
  getMe,
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdminInfo,
  updateAdminPassword,
  disableAdmin,
} = require('../controllers/adminController')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

router.get('/me', protect, getMe)

// Super Admin only
router.post('/create-admin', protect, authorize('SUPER_ADMIN'), createAdmin)
router.get('/all-admins', protect, getAllAdmins)


router.put('/update/:adminId', protect, authorize('SUPER_ADMIN'), updateAdminInfo)
router.put('/password/:adminId', protect, authorize('SUPER_ADMIN'), updateAdminPassword)
router.put('/status/:adminId', protect, authorize("SUPER_ADMIN"), disableAdmin);


// ⚠️ Keep this LAST
router.get('/:id', protect, getAdminById)



module.exports = router