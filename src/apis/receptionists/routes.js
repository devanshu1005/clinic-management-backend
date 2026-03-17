const express = require("express");
const router = express.Router();
const{createReceptionistSchema,
    loginreceptionistSchema,
    adminUpdatereceptionistPasswordSchema,
   disableReceptionistSchema,
   updateReceptionistSchema

}=require("./validation")


const{createReceptionist,
    receptionistLogin,
    getReceptionistProfile,
    getisActiveReceptionists,
    getinActiveReceptionists,
    getAllReceptionists,
  adminUpdatereceptionistsPassword,
 disableReceptionist,
  updateReceptionist
}=require("./controller")
const { protect, authorize, validate } = require("../../middlewares");
const responseHandler = require("../../utils/responseHandler");

router.post(
    "/create-receptionist",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    validate(createReceptionistSchema),
    responseHandler(createReceptionist)
);

router.post(
    "/login",
    
    validate(loginreceptionistSchema),
    responseHandler(receptionistLogin)
)



router.get(
    "/isActive",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    responseHandler(getisActiveReceptionists)
)
router.get(
    "/inActive",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    responseHandler(getinActiveReceptionists)
)

router.get(
    "/all-receptionists",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    responseHandler(getAllReceptionists)
)

router.get(
    "/:receptionistId",
    protect,
    responseHandler(getReceptionistProfile)
)

router.put(
    "/password/:receptionistId",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    validate(adminUpdatereceptionistPasswordSchema),
    responseHandler(adminUpdatereceptionistsPassword)
)

router.put(
    "/disable/:receptionistId",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    validate(disableReceptionistSchema),
    responseHandler(disableReceptionist)
)

router.put(
    "/update/:receptionistId",
    protect,
    authorize("ADMIN", "SUPER_ADMIN", "RECEPTIONIST"),
    validate(updateReceptionistSchema),
    responseHandler(updateReceptionist)
)
module.exports = router;
