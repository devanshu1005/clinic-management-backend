const bcrypt = require('bcryptjs')
const { generateToken } = require('/Users/raunaktiwari07/workspace/clinic-management-backend/src/utils/tokenUtils.js')
const { sendOTPEmail } = require('/Users/raunaktiwari07/workspace/clinic-management-backend/src/services/emailServices.js')
const { generateOTP } = require('/Users/raunaktiwari07/workspace/clinic-management-backend/src/utils/otpServices.js')
const{user}= require('../../models')

//const { sendOTPPhone } = require('../services/smsServices')


exports.sendOTP = async({ User, body}) => {

  const {identifier} = body


  //FIND USER BY EMAIL OR PHONE
const user = await User.findOne({
 // $or: [
 
     email: identifier 
    //{ phone: identifier }
 // ]
 
});


  if (!user){
    return {
      statusCode: 404,
      success: false,
      message: "user not found",
    };
  }

  const otp = generateOTP()
  const otpExpiry = new Date(Date.now() + 3 * 60 * 1000) // 3 minutes

  user.otpCode = otp
  user.otpExpiry = otpExpiry
  await user.save()

  console.log("OTP:", otp);
  if (user.email) {
    await sendOTPEmail(user.email, otp)
  }

// else {
//     await sendOTPPhone(user.phone, otp)
//   }
  
  return {
    statusCode: 200,
    success: true,
    message: `OTP sent to ${identifier}`,
    data:{

    }
  };

}


//OTP VERIFICATION

exports.verifyOTP = async({ body}) => {
  
  const{ identifier , otp} = body

user.findOne({
  $or: [
    { email: identifier },
    { phone: identifier }
  ]
})

  if (!user){
    return {
      statusCode: 404,
      success: false,
      message: "user not found",
    };
  }

  if (user.otpCode !== otp || user.otpExpiry > Date.now()) {
    return {
      statusCode: 400,
      success: false,
      message: `Invalid OTP`,
    };
  }

  const resetToken = generateToken(user._id)
  const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

  await  user.updateOne({
    resetToken,
    resetTokenExp: resetTokenExpiry,
    otpCode: null,
    otpExpiry: null
  })

  return {
    statusCode: 200,
    success: true,
    message: `OTP verified`,
    data: {
      resetToken,
      resetTokenExpiry
    }
  };
    
}

//RESET PASSWORD

exports.resetPassword = async({body}) => {

  const {resetToken , newPassword} = body

  const user = await user.findOne({
    resetToken,
    resetTokenExp: { $gt: new Date() }
  })

  if (!user){
    return {
      statusCode: 400,
      success: false,
      message: 'Invalid or expired reset token',
    };
  }
  if (newPassword.length < 6) {
  return {
    statusCode: 400,
    success: false,
    message: "Password must be at least 6 characters"
  }
}

  const hashedPassword = await bcrypt.hash(newPassword, 12)

  await user.updateOne({
    password: hashedPassword,
    resetToken: null,
    resetTokenExp: null
  })

  return {
    statusCode: 200,
    success: true,
    message: 'Password reset successfully',
  };
  
}