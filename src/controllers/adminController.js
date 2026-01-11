const bcrypt = require('bcryptjs')
const prisma = require('../config/db')
const { sendCredentialsEmail } = require('../services/emailServices')
const { generatePassword } = require('../utils/otpServices')

// =============================================
// CREATE ADMIN (Super Admin creates clinic owner)
// =============================================
exports.createAdmin = async (req, res, next) => {
  try {
    const { email, adminName, phone, clinicName, location } = req.body

    // Validate input
    if (!email || !adminName || !phone || !clinicName || !location) {
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

    const subscriptionExpiry = new Date()
    subscriptionExpiry.setMonth(subscriptionExpiry.getMonth() + 1)

    // 5️⃣ Create USER + ADMIN (Nested Create)
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: adminName,
        phone,
        role: 'ADMIN',

        Admin: {
          create: {
            clinicName,
            location,
            subsValidity: subscriptionExpiry
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        Admin: {
          select: {
            id: true,
            clinicName: true,
            location: true,
            subsValidity: true
          }
        }
      }
    })


    // Send credentials via email
    // await sendCredentialsEmail(email, {
    //   name: adminName,
    //   email: email,
    //   password: generatedPassword,
    //   clinicName: clinicName,
    //   loginUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/login`
    // })

    res.status(201).json({
  success: true,
  message: 'Admin created successfully. Credentials sent to email.',
  data: {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    phone: admin.phone,
    role: admin.role,

    clinic: {
      id: admin.Admin.id,
      clinicName: admin.Admin.clinicName,
      location: admin.Admin.location,
      subsValidity: admin.Admin.subsValidity
    },

    temporaryPassword: generatedPassword
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
        isActive: true,
        lastLogin: true,
        createdAt: true,

        Admin: {
          select: {
            id: true,
            clinicName: true,
            location: true,
            subsValidity: true
          }
        }
      }
    })

    const response = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,

      clinic: user.Admin
        ? {
            id: user.Admin.id,
            clinicName: user.Admin.clinicName,
            location: user.Admin.location,
            subsValidity: user.Admin.subsValidity
          }
        : null
    }

    res.status(200).json({
      success: true,
      data: response
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
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "Only Super Admin can view admins",
      });
    }

    const {
      status = "active",
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = Math.max(1, Number(page));
    const pageSize = Math.min(50, Number(limit)); // safety cap
    const skip = (pageNumber - 1) * pageSize;

    // status filter
    let userFilter = {};
    if (status === "active") userFilter.isActive = true;
    if (status === "inactive") userFilter.isActive = false;
    // status === "all" → no filter

    const whereClause = {
      user: userFilter,
    };

    const [total, admins] = await Promise.all([
      prisma.admin.count({ where: whereClause }),

      prisma.admin.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        select: {
          id: true,
          clinicName: true,
          location: true,
          subsValidity: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isActive: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const data = admins.map((a) => ({
      id: a.user.id,
      name: a.user.name,
      email: a.user.email,
      phone: a.user.phone,
      role: a.user.role,
      isActive: a.user.isActive,
      createdAt: a.createdAt,
      clinic: {
        id: a.id,
        clinicName: a.clinicName,
        location: a.location,
        subsValidity: a.subsValidity,
      },
    }));

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
    });
  } catch (error) {
    next(error);
  }
};


exports.getAdminById = async (req, res, next) => {
  try {
    // Only Super Admin can access
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only Super Admin can view admin details'
      });
    }

    const { id } = req.params;

    const admin = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,

        Admin: {
          select: {
            id: true,
            clinicName: true,
            location: true,
            subsValidity: true
          }
        }
      }
    });

    if (!admin || admin.role !== 'ADMIN') {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    const response = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      isActive: admin.isActive,
      createdAt: admin.createdAt,

      clinic: admin.Admin
        ? {
            id: admin.Admin.id,
            clinicName: admin.Admin.clinicName,
            location: admin.Admin.location,
            subsValidity: admin.Admin.subsValidity
          }
        : null
    };

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    next(error);
  }
};

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

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        code: "INVALID_INPUT",
        message: "isActive must be true or false",
      });
    }

    // Check admin exists
    const admin = await prisma.admin.findUnique({
      where: { userId: adminId },
      include: { user: true },
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        code: "ADMIN_NOT_FOUND",
        message: "Admin not found",
      });
    }

    // Prevent disabling yourself
    if (admin.userId === req.user.id) {
      return res.status(400).json({
        success: false,
        code: "SELF_DISABLE_NOT_ALLOWED",
        message: "You cannot deactivate yourself",
      });
    }

    await prisma.user.update({
      where: { id: admin.userId },
      data: { isActive },
    });

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

    if (!admin || admin.role !== "ADMIN") {
      return res.status(404).json({
        success: false,
        error: "Admin not found"
      })
    }

    // ===== Update user + admin safely =====
    const updatedUser = await prisma.user.update({
      where: { id: adminId },
      data: {
        name: adminName || admin.name,
        isActive: typeof isActive === "boolean" ? isActive : admin.isActive,
        Admin: subsValidity
          ? { update: { subsValidity: new Date(subsValidity) } }
          : undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        role: true,
        updatedAt: true,
        Admin: {
          select: {
            id: true,
            clinicName: true,
            location: true,
            subsValidity: true
          }
        }
      }
    })

    // ===== Simple JSON Response =====
    const response = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      updatedAt: updatedUser.updatedAt,
      clinic: updatedUser.Admin
        ? {
            id: updatedUser.Admin.id,
            clinicName: updatedUser.Admin.clinicName,
            location: updatedUser.Admin.location,
            subsValidity: updatedUser.Admin.subsValidity
          }
        : null
    }

    res.status(200).json({
      success: true,
      message: "Admin info updated successfully",
      data: response
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
