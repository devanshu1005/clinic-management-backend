const express = require("express");
const router = express.Router();
//const {  } = require("./validation");
const { protect, authorize, validate } = require("../../middlewares");
const{getSalaryDashboardListSchema,getSalaryDashboardSummarySchema}=require("./validation");
const { getAdminDashboard,getDoctorDashboard,getReceptionistDashboard,getStaffDashboard,getSuperAdminDashboard,getSalaryDashboardList,getSalaryDashboardSummary,getEmployeesOnLeaveToday,getUpcomingLeaves,getLeaveDashboardSummary,getPendingLeavesDashboard} = require("./controller");
const responseHandler = require("../../utils/responseHandler");

router.get(
    "/superadmin-dashboard",
    protect,
    authorize("SUPER_ADMIN"),

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

router.get(
    "/salarydashboardlist",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    validate(getSalaryDashboardListSchema,
        "query"
    ),
    responseHandler(getSalaryDashboardList)
)

router.get(
    "/salarysummery",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    validate(getSalaryDashboardSummarySchema,"query"),
    responseHandler(getSalaryDashboardSummary)
)

router.get(
    "/upcoming-leaves",
    protect,
    authorize( "ADMIN", "SUPER_ADMIN"),
    responseHandler(getUpcomingLeaves )

)

router.get(
    "/leavesummery",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    responseHandler(getLeaveDashboardSummary )

)
router.get(
    "/pendingleaves",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    responseHandler(getPendingLeavesDashboard )

)
router.get(
    "/today-leaves",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    responseHandler(getEmployeesOnLeaveToday ))

module.exports=router;