const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");

const {
  createReceptionist,
  getReceptionistProfile,
  getAllReceptionists,
  updateReceptionist,
  disableReceptionist,
  adminUpdateReceptionistPassword
} = require("../controllers/receptionistController");

// ADMIN creates receptionist
router.post("/create-receptionist", protect,createReceptionist);


// Get all receptionists (ADMIN)
router.get("/", protect, getAllReceptionists);

// Get receptionist profile
router.get("/:receptionistId", protect, getReceptionistProfile);

// Update receptionist profile
router.put("/:receptionistId", protect, updateReceptionist);

// ADMIN updates receptionist password
router.put(
  "/:receptionistId/password",
  protect,
  adminUpdateReceptionistPassword
);

// Disable receptionist (ADMIN)
router.put("/:receptionistId/disable", protect, disableReceptionist);

module.exports = router;
