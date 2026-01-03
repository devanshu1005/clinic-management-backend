const bcrypt = require('bcryptjs')
const prisma = require('../config/db')
const { generateToken } = require('../utils/tokenUtils')
const { sendOTPEmail } = require('../services/emailServices')
const { generateOTP } = require('../utils/otpServices')


// =============================================
// SUPER ADMIN LOGIN (Fixed Credentials)
// =============================================
exports.superAdminLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      })
    }

    // Check credentials against environment variables
    const validUsername = process.env.SUPER_ADMIN_USERNAME
    const validPassword = process.env.SUPER_ADMIN_PASSWORD

    if (username !== validUsername || password !== validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid super admin credentials'
      })
    }

    // Create a mock super admin object for token generation
    const superAdmin = {
      id: 'super-admin-001', // Fixed ID for super admin
      username: validUsername,
      email: process.env.SUPER_ADMIN_EMAIL,
      role: 'SUPER_ADMIN',
      name: 'Super Admin'
    }

    // Generate JWT token
    const token = generateToken(superAdmin.id, superAdmin.role)

    res.json({
      success: true,
      message: 'Super Admin login successful',
      data: {
        user: {
          id: superAdmin.id,
          username: superAdmin.username,
          email: superAdmin.email,
          role: superAdmin.role,
          name: superAdmin.name
        },
        token
      }
    })
  } catch (error) {
    next(error)
  }
}

// =============================================
// SINGLE LOGIN FOR ALL ROLES
// =============================================
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } })
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      })
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      })
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        error: 'Account is inactive. Contact support.' 
      })
    }

    // Check subscription validity for ADMIN role
   if (user.role === 'ADMIN' && user.subsValidity) {
      if (new Date() > user.subsValidity) {
        return res.status(403).json({ 
          success: false, 
          error: 'Subscription expired. Please renew.' 
        })
      }
    }

    // Update last login
   await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    // Generate JWT token
    const token = generateToken(user.id)
  

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      }
    })
  } catch (error) {
    next(error)
  }
}

// =============================================
// SEND OTP (for password reset - email or phone)
// =============================================
exports.sendOTP = async (req, res, next) => {
  try {
    const { identifier } = req.body // Can be email or phone

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    })

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      })
    }

    // Generate 6-digit OTP
    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 3 * 60 * 1000) // 60 seconds

    // Save OTP to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: otp,
        otpExpiry: otpExpiry
      }
    })

    // Send OTP via email (or SMS if phone)
    if (user.email === identifier) {
      await sendOTPEmail(user.email, otp, user.name)
    } else {
      // TODO: Implement SMS service (Twilio, AWS SNS, etc.)
      // await sendOTPSMS(user.phone, otp)
    }

    res.json({
      success: true,
      message: `OTP sent to ${identifier}`,
      data: {
        identifier: identifier,
        expiresIn: '3 minutes'
      }
    })
  } catch (error) {
    next(error)
  }
}

// =============================================
// VERIFY OTP
// =============================================
exports.verifyOTP = async (req, res, next) => {
  try {
    const { identifier, otp } = req.body

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    })

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      })
    }

    // Check OTP
    if (user.otpCode !== otp) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid OTP' 
      })
    }

    // Check expiry
    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ 
        success: false, 
        error: 'OTP expired. Request a new one.' 
      })
    }

    // Generate reset token (valid for 15 minutes)
    const resetToken = require('crypto').randomBytes(32).toString('hex')
    const resetTokenExp = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExp,
        otpCode: null, // Clear OTP after verification
        otpExpiry: null
      }
    })

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        resetToken // Send this to client for password reset
      }
    })
  } catch (error) {
    next(error)
  }
}

// =============================================
// RESET PASSWORD (after OTP verification)
// =============================================
exports.resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken,
        resetTokenExp: { gt: new Date() }
      }
    })

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid or expired reset token' 
      })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExp: null
      }
    })

    res.json({
      success: true,
      message: 'Password reset successful. Please login with new password.'
    })
  } catch (error) {
    next(error)
  }
}
