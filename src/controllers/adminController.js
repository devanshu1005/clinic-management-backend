const bcrypt = require('bcryptjs')
const prisma = require('../config/db')
const { sendCredentialsEmail} = require('../services/emailServices')
const { generatePassword } = require('../utils/otpServices')

// =============================================
// CREATE ADMIN (Super Admin creates clinic owner)
// =============================================
exports.createAdmin = async (req, res, next) => {
  try {
    const { email, adminName, phone, clinicName, location, subsValidity } = req.body

    // Validate input
    if (!email || !adminName || !phone || !clinicName || !location || !subsValidity) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: email, adminName, phone, clinicName, location, subsValidity'
      })
    }

    // Check if request is from super admin
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ 
        success: false, 
        error: 'Only Super Admin can create clinic owners' 
      })
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email already registered' 
      })
    }

    // Generate random password
    const generatedPassword = generatePassword() // e.g., "Abc123!@#"
    const hashedPassword = await bcrypt.hash(generatedPassword, 12)

    // Create admin
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: adminName,
        phone: phone,
        role: 'ADMIN',
        clinicName,
        location,
        subsValidity: new Date(subsValidity),
        isActive: true,
        isVerified: false
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        clinicName: true,
        location: true,
        subsValidity: true,
        createdAt: true
      }
    })

    // Send credentials via email
    await sendCredentialsEmail(email, {
      name: adminName,
      email: email,
      password: generatedPassword,
      clinicName: clinicName,
      loginUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/login`
    })

    res.status(201).json({
      success: true,
      message: 'Admin created successfully. Credentials sent to email.',
      data: {
        admin,
        temporaryPassword: generatedPassword // Include in response for testing
      }
    })
  } catch (error) {
    next(error)
  }
}

// =============================================
// GET CURRENT USER (Protected route)
// =============================================
exports.getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        clinicName: true,
        location: true,
        subsValidity: true,
        isActive: true,
        lastLogin: true,
        createdAt: true
      }
    })

    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    next(error)
  }
}

// =============================================
// GET ALL ADMINS (Only Super Admin)
// =============================================
exports.getAllAdmins = async (req, res, next) => {
  try {
    // Only super admin can access this API
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only Super Admin can view all admins'
      })
    }

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        clinicName: true,
        location: true,
        subsValidity: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins
    })
  } catch (error) {
    next(error)
  }
}

// =============================================
// UPDATE ADMIN INFO (Only Super Admin)
// =============================================
exports.updateAdminInfo = async (req, res, next) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: "Only Super Admin can update admin information"
      })
    }

    const { adminId } = req.params
    const { adminName, subsValidity, isActive } = req.body

    // Check admin exists
    const admin = await prisma.user.findUnique({ where: { id: adminId } })
    if (!admin || admin.role !== 'ADMIN') {
      return res.status(404).json({
        success: false,
        error: "Admin not found"
      })
    }

    // Update admin info
    const updatedAdmin = await prisma.user.update({
      where: { id: adminId },
      data: {
        name: adminName || admin.name,
        subsValidity: subsValidity ? new Date(subsValidity) : admin.subsValidity,
        isActive: typeof isActive === "boolean" ? isActive : admin.isActive
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        clinicName: true,
        location: true,
        isActive: true,
        subsValidity: true,
        updatedAt: true
      }
    })

    res.status(200).json({
      success: true,
      message: "Admin info updated successfully",
      data: updatedAdmin
    })
  } catch (error) {
    next(error)
  }
}

// =============================================
// UPDATE ADMIN PASSWORD (Super Admin only)
// =============================================
exports.updateAdminPassword = async (req, res, next) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: "Only Super Admin can update admin password"
      })
    }

    const { adminId } = req.params
    const { newPassword } = req.body

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: "New password is required"
      })
    }

    // Check admin exists
    const admin = await prisma.user.findUnique({ where: { id: adminId } })
    if (!admin || admin.role !== 'ADMIN') {
      return res.status(404).json({
        success: false,
        error: "Admin not found"
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: adminId },
      data: { password: hashedPassword }
    })

    res.status(200).json({
      success: true,
      message: "Admin password updated successfully"
    })
  } catch (error) {
    next(error)
  }
}
