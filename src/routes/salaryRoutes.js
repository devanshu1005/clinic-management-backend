const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");

const {
  addSalaryEntry,
  updateBaseSalary,
  getSalaryHistory,
  getEmployeeSalaryDetails,
  downloadPayslip,
} = require("../controllers/salaryController");

// ADD SALARY ENTRY
router.post("/", protect, addSalaryEntry);

// UPDATE BASE SALARY
router.put("/update", protect, updateBaseSalary);

// SALARY HISTORY/penalty/revision/bonus
router.get("/history/:userId/:userRole", protect, getSalaryHistory);

// SALARY DETAILS (MONTHLY / YEARLY)
router.get("/details", protect, getEmployeeSalaryDetails);     



// DOWNLOAD PAYSLIP
router.get("/payslip", protect, downloadPayslip);

module.exports = router;
