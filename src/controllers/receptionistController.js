const bcrypt = require("bcryptjs");
const prisma = require("../config/db");
const { sendCredentialsEmail } = require("../services/emailServices");
const { generatePassword } = require("../utils/otpServices");

// =====================================================================
// CREATE RECEPTIONIST (ADMIN only)
// =====================================================================
exports.createReceptionist = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Only Admin can create a receptionist",
      });
    }

    const {
      name,
      email,
      phone,
      experience,
      salary,
      shift,
      gender,
      aadhaar,
      address,
      deskNumber,
      shiftTiming,
    } = req.body;

    // Check email exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Email already registered",
      });
    }
    // Check Aadhaar exists
const aadhaarExists = await prisma.receptionist.findUnique({
  where: { aadhaar }
});

if (aadhaarExists) {
  return res.status(400).json({
    success: false,
    error: "Aadhaar already registered"
  });
}

    // Generate password
    const rawPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    // Create user + receptionist profile
    const receptionist = await prisma.receptionist.create({
      data: {
        user: {
          create: {
            email,
            password: hashedPassword,
            name,
            phone,
            role: "RECEPTIONIST",
          },
        },
        experience,
        salary: Number(salary),
        shift,
        gender,
        aadhaar,
        address,
        deskNumber,
        shiftTiming,
      },
      include: {
        user: true,
      },
    });

    // Send credentials via email
    await sendCredentialsEmail(email, {
      name,
      email,
      password: rawPassword,
      loginUrl: `${process.env.CLIENT_URL}/login`,
    });

    res.status(201).json({
      success: true,
      message: "Receptionist created successfully",
      data: {
        ...receptionist,
        password: rawPassword, // dev/testing only
      },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================================
// GET RECEPTIONIST PROFILE
// =====================================================================
exports.getReceptionistProfile = async (req, res, next) => {
  try {
    const { receptionistId } = req.params;

    const receptionist = await prisma.receptionist.findUnique({
      where: { id: receptionistId },
      include: { user: true },
    });

    if (!receptionist) {
      return res.status(404).json({
        success: false,
        error: "Receptionist not found",
      });
    }

    // Receptionist can view own profile
    if (
      req.user.role === "RECEPTIONIST" &&
      req.user.id !== receptionist.userId
    ) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    res.json({ success: true, data: receptionist });
  } catch (error) {
    next(error);
  }
};

// =====================================================================
// UPDATE RECEPTIONIST
// =====================================================================
exports.updateReceptionist = async (req, res, next) => {
  try {
    const { receptionistId } = req.params;

    const receptionist = await prisma.receptionist.findUnique({
      where: { id: receptionistId },
      include: { user: true },
    });

    if (!receptionist) {
      return res.status(404).json({
        success: false,
        error: "Receptionist not found",
      });
    }

    const isAdmin = req.user.role === "ADMIN";
    const isSelf =
      req.user.role === "RECEPTIONIST" &&
      req.user.id === receptionist.userId;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    const {
      name,
      phone,
      experience,
      salary,
      shift,
      gender,
      aadhaar,
      address,
      deskNumber,
      shiftTiming,
    } = req.body;

    // Receptionist can edit limited fields
    if (isSelf) {
      const updated = await prisma.receptionist.update({
        where: { id: receptionistId },
        data: {
          experience,
          address,
          deskNumber,
          shiftTiming,
          user: { update: { name, phone } },
        },
        include: { user: true },
      });

      return res.json({
        success: true,
        message: "Profile updated",
        data: updated,
      });
    }

    // Admin can edit everything
    const updated = await prisma.receptionist.update({
      where: { id: receptionistId },
      data: {
        experience,
        salary,
        shift,
        gender,
        aadhaar,
        address,
        deskNumber,
        shiftTiming,
        user: { update: { name, phone } },
      },
      include: { user: true },
    });

    res.json({
      success: true,
      message: "Receptionist updated",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// ADMIN UPDATE RECEPTIONIST PASSWORD

exports.adminUpdateReceptionistPassword = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Only Admin can update receptionist password",
      });
    }

    const { receptionistId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: "New password is required",
      });
    }

    const receptionist = await prisma.receptionist.findUnique({
      where: { id: receptionistId },
      include: { user: true },
    });

    if (!receptionist) {
      return res.status(404).json({
        success: false,
        error: "Receptionist not found",
      });
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: receptionist.userId },
      data: { password: hashed },
    });

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
};
// =====================================================================
// GET ALL RECEPTIONISTS (ADMIN only)
// =====================================================================
exports.getAllReceptionists = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Only Admin can view all receptionists",
      });
    }

    const receptionists = await prisma.receptionist.findMany({
      where: {
        user: {
          isActive: true, // only active receptionists
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      data: receptionists,
    });
  } catch (error) {
    next(error);
  }
};
// =====================================================================
// DISABLE RECEPTIONIST (ADMIN only)
// =====================================================================
exports.disableReceptionist = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Only Admin can disable a receptionist",
      });
    }

    const { receptionistId } = req.params;

    const receptionist = await prisma.receptionist.findUnique({
      where: { id: receptionistId },
    });

    if (!receptionist) {
      return res.status(404).json({
        success: false,
        error: "Receptionist not found",
      });
    }

    await prisma.user.update({
      where: { id: receptionist.userId },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: "Receptionist disabled successfully",
    });
  } catch (error) {
    next(error);
  }
};
