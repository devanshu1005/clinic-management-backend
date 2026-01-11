const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");

const {
  createStaff,
  getStaffProfile,
  getAllStaff,
  updateStaff,
  adminUpdateStaffPassword,
  disableStaff,
  getStaffDashboardSummary
} = require("../controllers/staffController");

// ADMIN creates staff
router.post("/create-staff", protect, createStaff);

// STAFF DASHBOARD (ADMIN)

router.get(
  "/dashboard",
  protect,
  getStaffDashboardSummary
);

// Get single staff profile
router.get("/:staffId", protect, getStaffProfile);

// Get all staff (ADMIN)
router.get("/", protect, getAllStaff);

// Update staff
router.put("/:staffId", protect, updateStaff);

// Update staff password (ADMIN)
router.put("/:staffId/password", protect, adminUpdateStaffPassword);

// Disable staff (ADMIN)
router.put("/:staffId/disable", protect, disableStaff);

module.exports = router;
