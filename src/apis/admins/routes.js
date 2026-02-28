const express = require('express')
const router = express.Router()

// New structure imports
const adminController = require('./controller')
const adminValidation = require('./validation')

const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')


// =============================================
// CURRENT USER
// =============================================
router.get('/me', protect, adminController.getMe)


// =============================================
// SUPER ADMIN ROUTES
// =============================================
router.post(
  '/create-admin',
  protect,
  authorize('SUPER_ADMIN'),
  adminValidation.validateCreateAdmin,
  adminController.createAdmin
)

router.get(
  '/all-admins',
  protect,
  adminController.getAllAdmins
)

router.put(
  '/update/:adminId',
  protect,
  authorize('SUPER_ADMIN'),
  adminController.updateAdminInfo
)

router.put(
  '/password/:adminId',
  protect,
  authorize('SUPER_ADMIN'),
  adminValidation.validateUpdatePassword,
  adminController.updateAdminPassword
)

router.put(
  '/status/:adminId',
  protect,
  authorize('SUPER_ADMIN'),
  adminValidation.validateDisableAdmin,
  adminController.disableAdmin
)


// ⚠️ KEEP THIS LAST
router.get(
  '/:id',
  protect,
  adminController.getAdminById
)

module.exports = router