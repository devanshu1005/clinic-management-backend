const express = require("express");
const router = express.Router();
//const {  } = require("./validation");
const { protect, authorize, validate } = require("../../middlewares");
const { getAdminDashboard,getDoctorDashboard,getReceptionistDashboard,getStaffDashboard,getSuperAdminDashboard} = require("./controller");
const responseHandler = require("../../utils/responseHandler");

router.get(
    "superadmin-dashboard",
    protect,

    responseHandler(getSuperAdminDashboard)
)


router.get(
    "/admindashboard",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    responseHandler(getAdminDashboard)
)

router.get(
    "/doctordashboard",
    protect,
    authorize("DOCTOR"),
    responseHandler(getDoctorDashboard)
)
router.get(
    "/receptionistdashboard",
    protect,
    authorize("RECEPTIONIST", "SUPER_ADMIN"),
    responseHandler(getReceptionistDashboard)
)

router.get(
    "/staffdashboard",
    protect,
    authorize("STAFF"),
    responseHandler(getStaffDashboard)
)
module.exports=router;