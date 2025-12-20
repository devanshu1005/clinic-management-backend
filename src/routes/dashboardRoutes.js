const express = require('express')
const router = express.Router()
const {
  getSuperAdminDashboard,
  getAdminDashboard,
  getAdminStatistics,
  getAllAdmins,
  searchAdmins,           // ← Add
  quickSearchAdmins,      // ← Add
  advancedSearchAdmins    // ← Add
} = require('../controllers/dashboardController')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

// All routes require authentication
router.use(protect)

// Super Admin routes
router.get('/super-admin', authorize('SUPER_ADMIN'), getSuperAdminDashboard)
router.get('/statistics', authorize('SUPER_ADMIN'), getAdminStatistics)
router.get('/admins', authorize('SUPER_ADMIN'), getAllAdmins)
// Search routes
router.get('/search', authorize('SUPER_ADMIN'), searchAdmins)              // ← Add
router.get('/quick-search', authorize('SUPER_ADMIN'), quickSearchAdmins)   // ← Add
router.post('/advanced-search', authorize('SUPER_ADMIN'), advancedSearchAdmins) // ← Add

// Admin routes
router.get('/admin', authorize('ADMIN'), getAdminDashboard)

module.exports = router