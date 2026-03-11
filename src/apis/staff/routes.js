const express = require("express");
const router = express.Router();
const{createStaffSchema , loginstaffSchema,adminUpdatestaffPasswordSchema,disablestafftSchema,updatestaffSchema} = require("./validation")

const{createStaff,stafflogin,getStaffProfile, getisActiveStaff,getinActiveStaff,getAllStaff,adminUpdatestaffPassword,disableStaff,updateStaff} = require("./controller")

const { protect, authorize, validate,} = require("../../middlewares");

const responseHandler = require("../../utils/responseHandler");

router.post(
    "/create-staff",
    protect,
    authorize("ADMIN","SUPER_ADMIN"),
    validate(createStaffSchema),
    responseHandler(createStaff)

)

router.post(
    "/login",
    
    validate(loginstaffSchema),
    responseHandler(stafflogin)
)

router.get(
    "/all-staff",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    responseHandler(getAllStaff)
)
router.get(
    "/isActive",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    responseHandler(getisActiveStaff)
)
router.get(
    "/inActive",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    responseHandler(getinActiveStaff)
)
router.get(
    "/:staffId",
    protect,
   // authorize("ADMIN", "SUPER_ADMIN"),
    responseHandler(getStaffProfile)

)


router.put(
    "/password/:staffId",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    validate(adminUpdatestaffPasswordSchema),
    responseHandler(adminUpdatestaffPassword)
)
router.put(
    "/disable/:staffId",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    validate(disablestafftSchema),
    responseHandler(disableStaff)
)


router.put(
    "/update/:staffId",
    protect,
    authorize("ADMIN", "SUPER_ADMIN", "STAFF"),
    validate(updatestaffSchema),
    responseHandler(updateStaff)
)

module.exports = router;

