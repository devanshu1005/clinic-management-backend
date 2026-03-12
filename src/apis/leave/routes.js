const express = require("express");
const router = express.Router();
const{applyLeaveSchema}=require("./validation");
const{applyLeave,getAllLeaves,getMyLeaves,approveLeave,rejectLeave,getLeaveBalance,getLeaveHistory}=require("./controller");
const responseHandler = require("../../utils/responseHandler");
const { protect, authorize, validate } = require("../../middlewares");
router.post(
    "/apply-leave",
    protect,
    authorize("ADMIN", "SUPER_ADMIN", "STAFF", "DOCTOR", "RECEPTIONIST"),
    validate(applyLeaveSchema),
    responseHandler(applyLeave)
)

router.get(
    "/all-leaves",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    responseHandler(getAllLeaves)
)

router.get(
    "/my-leaves",
    protect,
    authorize("ADMIN", "SUPER_ADMIN", "STAFF", "DOCTOR", "RECEPTIONIST"),
    responseHandler(getMyLeaves)
)

router.put(
    "/approve-leave/:leaveId",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    responseHandler(approveLeave)
)

router.put(
    "/reject-leave/:leaveId",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    responseHandler(rejectLeave)
)

router.get(
    "/leave-balance/:leaveId",
    protect,
    authorize("ADMIN", "SUPER_ADMIN", "STAFF", "DOCTOR", "RECEPTIONIST"),
    responseHandler(getLeaveBalance)
)

router.get(
    "/leave-history/:userId",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    responseHandler(getLeaveHistory)
)
module.exports = router;