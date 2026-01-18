const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");

const {
    applyLeave,
    getMyLeaves,
    getEmployeeLeaveHistory,
    getLeaveBalance,
  getAllLeaves,
  approveLeave,
  rejectLeave
} = require("../controllers/leaveController");


// APPLY LEAVE (Employee or Admin)
router.post("/apply", protect, applyLeave);

// GET MY LEAVES (Employee)
router.get("/my-leaves", protect, getMyLeaves);
//employee history
router.get("/employee/:userId", protect, getEmployeeLeaveHistory);
router.get("/balance", protect, getLeaveBalance);

//get all leaves
router.get("/", protect, getAllLeaves);

// APPROVE / REJECT
router.put("/:leaveId/approve", protect, approveLeave);
router.put("/:leaveId/reject", protect, rejectLeave);

module.exports = router;
