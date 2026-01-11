const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
  createDoctor,
  getDoctorProfile,
  updateDoctor,
  adminUpdateDoctorPassword,
  getAllDoctors,
  disableDoctor
} = require("../controllers/doctorController");
const { authorize } = require("../middlewares/roleMiddleware");

router.post("/create-doctor", protect, createDoctor);

router.get("/all-doctors", protect, getAllDoctors); 

router.put("/:doctorId/password", protect, adminUpdateDoctorPassword); 

router.put("/:doctorId/status", protect, authorize("ADMIN"), disableDoctor);
router.get("/:doctorId", protect, getDoctorProfile); 
router.put("/:doctorId", protect, updateDoctor); 


module.exports = router;
