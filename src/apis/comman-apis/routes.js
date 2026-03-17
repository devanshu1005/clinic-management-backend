const express = require("express");
const router = express.Router();
//const{}=require("./validation");
const{sendOTP,verifyOTP,resetPassword}= require("./controller");
const responsehandler = require("../../utils/responseHandler.js")
const{protect}=require("../../middlewares")

router.post(
    "/send-otp",
 
    responsehandler(sendOTP)
)

router.post(
    "/verify-otp",
    protect,
    responsehandler(verifyOTP)
)

router.post(
    "/reset-password",
    protect,
    responsehandler(resetPassword)
)

module.exports = router;
