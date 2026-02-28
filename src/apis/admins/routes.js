const express = require("express");
const router = express.Router();
const { createAdminSchema } = require("./validation");
const { protect, authorize, validate } = require("../middlewares");
const { createAdmin , getMe} = require("./controller")
const responseHandler = require("../utils/responseHandler");

// =============================================
// CURRENT USER
// =============================================
router.get("/me", protect, adminController.getMe);

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

router.get("/all-admins", protect, adminController.getAllAdmins);

router.put(
  "/update/:adminId",
  protect,
  authorize("SUPER_ADMIN"),
  adminController.updateAdminInfo,
);

router.put(
  "/password/:adminId",
  protect,
  authorize("SUPER_ADMIN"),
  adminValidation.validateUpdatePassword,
  adminController.updateAdminPassword,
);

router.put(
  "/status/:adminId",
  protect,
  authorize("SUPER_ADMIN"),
  adminValidation.validateDisableAdmin,
  adminController.disableAdmin,
);

// ⚠️ KEEP THIS LAST
router.get("/:id", protect, adminController.getAdminById);

module.exports = router;
