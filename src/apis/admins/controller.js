const bcrypt = require('bcryptjs')
const User = require('../models/userModel')
const Admin = require('../models/adminModel')
const { generatePassword } = require('../utils/otpServices')

// =============================================
// CREATE ADMIN
// =============================================
exports.createAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only Super Admin can create clinic owners'
      })
    }

    const { email, adminName, phone, clinicName, location } = req.body

    const existingUser = await User.findOne({ email }).select('_id').lean()
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      })
    }

    const generatedPassword = generatePassword()
    const hashedPassword = await bcrypt.hash(generatedPassword, 12)

    const subscriptionExpiry = new Date()
    subscriptionExpiry.setMonth(subscriptionExpiry.getMonth() + 1)

    const user = await User.create({
      email,
      password: hashedPassword,
      name: adminName,
      phone,
      role: 'ADMIN'
    })

    const admin = await Admin.create({
      user: user._id,
      clinicName,
      location,
      subsValidity: subscriptionExpiry
    })

    res.status(201).json({
      success: true,
      message: 'Admin created successfully.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        clinic: {
          id: admin._id,
          clinicName: admin.clinicName,
          location: admin.location,
          subsValidity: admin.subsValidity
        },
        temporaryPassword: generatedPassword
      }
    })

  } catch (error) {
    next(error)
  }
}


// =============================================
// GET CURRENT USER
// =============================================
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('name email phone role isActive lastLogin createdAt')
      .populate({
        path: 'admin',
        select: 'clinicName location subsValidity createdAt'
      })
      .lean()

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        clinic: user.admin
          ? {
              id: user.admin._id,
              clinicName: user.admin.clinicName,
              location: user.admin.location,
              subsValidity: user.admin.subsValidity
            }
          : null
      }
    })

  } catch (error) {
    next(error)
  }
}


// =============================================
// GET ALL ADMINS
// =============================================
exports.getAllAdmins = async (req, res, next) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "Only Super Admin can view admins",
      });
    }

    const { status = "active", page = 1, limit = 10 } = req.query;

    const pageNumber = Math.max(1, Number(page));
    const pageSize = Math.min(50, Number(limit));
    const skip = (pageNumber - 1) * pageSize;

    let userFilter = {};
    if (status === "active") userFilter.isActive = true;
    if (status === "inactive") userFilter.isActive = false;

    const admins = await Admin.find()
      .select('clinicName location subsValidity createdAt user')
      .populate({
        path: "user",
        match: userFilter,
        select: 'name email phone role isActive createdAt'
      })
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 })
      .lean();

    const filtered = admins.filter(a => a.user)

    const total = await Admin.countDocuments()

    const data = filtered.map(a => ({
      id: a.user._id,
      name: a.user.name,
      email: a.user.email,
      phone: a.user.phone,
      role: a.user.role,
      isActive: a.user.isActive,
      createdAt: a.createdAt,
      clinic: {
        id: a._id,
        clinicName: a.clinicName,
        location: a.location,
        subsValidity: a.subsValidity
      }
    }))

    return res.status(200).json({
      success: true,
      code: "ADMINS_FETCHED",
      message: "Admins fetched successfully",
      meta: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        status,
      },
      data,
    })

  } catch (error) {
    next(error);
  }
};


// =============================================
// GET ADMIN BY ID
// =============================================
exports.getAdminById = async (req, res, next) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only Super Admin can view admin details'
      });
    }

    const user = await User.findById(req.params.id)
      .select('name email phone role isActive createdAt')
      .populate({
        path: 'admin',
        select: 'clinicName location subsValidity'
      })
      .lean()

    if (!user || user.role !== 'ADMIN') {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        clinic: user.admin
      }
    });

  } catch (error) {
    next(error);
  }
};


// =============================================
// DISABLE ADMIN
// =============================================
exports.disableAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "Only Super Admin can update admin status",
      });
    }

    const { adminId } = req.params;
    const { isActive } = req.body;

    const admin = await Admin.findOne({ user: adminId }).select('user').lean()

    if (!admin) {
      return res.status(404).json({
        success: false,
        code: "ADMIN_NOT_FOUND",
        message: "Admin not found",
      });
    }

    if (admin.user.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        code: "SELF_DISABLE_NOT_ALLOWED",
        message: "You cannot deactivate yourself",
      });
    }

    await User.findByIdAndUpdate(
      adminId,
      { isActive },
      { runValidators: true }
    )

    return res.status(200).json({
      success: true,
      code: "ADMIN_STATUS_UPDATED",
      message: `Admin has been ${isActive ? "activated" : "deactivated"} successfully`,
    });

  } catch (error) {
    next(error);
  }
};


// =============================================
// UPDATE ADMIN PASSWORD
// =============================================
exports.updateAdminPassword = async (req, res, next) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: "Only Super Admin can update admin password"
      })
    }

    const admin = await User.findById(req.params.adminId).select('role')

    if (!admin || admin.role !== 'ADMIN') {
      return res.status(404).json({
        success: false,
        error: "Admin not found"
      })
    }

    const hashedPassword = await bcrypt.hash(req.body.newPassword, 12)

    await User.findByIdAndUpdate(
      req.params.adminId,
      { password: hashedPassword },
      { runValidators: true }
    )

    res.status(200).json({
      success: true,
      message: "Admin password updated successfully"
    })

  } catch (error) {
    next(error)
  }
}