const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
  createDoctor,
  getDoctorProfile,
  updateDoctor,
  adminUpdateDoctorPassword
} = require("../controllers/doctorController");

router.post("/create-doctor", protect, createDoctor); 

router.put("/:doctorId/password", protect, adminUpdateDoctorPassword); 

router.get("/:doctorId", protect, getDoctorProfile); 
router.put("/:doctorId", protect, updateDoctor); 


module.exports = router;
