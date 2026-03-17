const express = require("express");
const router = express.Router();
const { createAdminSchema, UpdatePasswordSchema, DisableAdminschema,loginSchema } = require("./validation");
const { protect, authorize, validate } = require("../../middlewares");
const { createAdmin , getMe,getAllAdmins,updateAdminInfo,updateAdminPassword,disableAdmin,getAdminById,adminLogin} = require("./controller");
const responseHandler = require("../../utils/responseHandler");
console.log("validate", validate,authorize);
// =============================================
// CURRENT USER
// =============================================
router.get("/me", 
  protect, 
  responseHandler(getMe));

//login
  router.post(
    "/login",
    validate(loginSchema),
    responseHandler(adminLogin)
  );

// =============================================
// SUPER ADMIN ROUTES
// =============================================
router.post(
  "/create-admin",
  protect,
  authorize("SUPER_ADMIN"),
  validate(createAdminSchema),
  responseHandler(createAdmin ),
);

router.get(
  "/all-admins", 
  protect, 
  responseHandler(getAllAdmins),
);

router.put(
  "/update/:adminId",
  protect,
  authorize("SUPER_ADMIN"),
  responseHandler(updateAdminInfo),
);

router.put(
  "/password/:adminId",
  protect,
  authorize("SUPER_ADMIN"),
  validate(UpdatePasswordSchema),
  responseHandler(updateAdminPassword),
);

router.put(
  "/status/:adminId",
  protect,
  authorize("SUPER_ADMIN"),
  validate(DisableAdminschema),
  responseHandler(disableAdmin),
);

// ⚠️ KEEP THIS LAST
router.get("/:id", 
  protect, 
  responseHandler(getAdminById));

module.exports = router;
