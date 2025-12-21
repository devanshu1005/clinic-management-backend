const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");

const {
  createReceptionist,
  getReceptionistProfile,
  updateReceptionist,
  adminUpdateReceptionistPassword
} = require("../controllers/receptionistController");

// ADMIN creates receptionist
router.post("/create-receptionist", protect, createReceptionist);

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

module.exports = router;
