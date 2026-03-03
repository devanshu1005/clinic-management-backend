const express = require("express");
const router = express.Router();
const{loginSuperAdminSchema} = require("./validation");
const { validate } = require("../../middlewares");

const {
 loginSuperAdmin
} = require("./controller");
const responseHandler = require("../../utils/responseHandler");

router.post(
  "/login",
  validate(loginSuperAdminSchema),
  responseHandler(loginSuperAdmin)
);

module.exports = router;