const bcrypt = require("bcryptjs");
const prisma = require("../config/db");
const { sendCredentialsEmail } = require("../services/emailServices");
const { generatePassword } = require("../utils/otpServices");


// CREATE STAFF (ADMIN only)

exports.createStaff = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Only Admin can create staff",
      });
    }

    const {
      name,
      email,
      phone,
      skill,
      category,
      experience,
      salary,
      shift,
      gender,
      aadhaar,
      address,
      registrationNo,
      department,
      staffCode,
      joiningDate,
      roleBadge,
    } = req.body;

    // Check email exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Email already registered",
      });
    }

    // Check aadhaar exists
    const aadhaarExists = await prisma.staff.findUnique({
      where: { aadhaar },
    });
    if (aadhaarExists) {
      return res.status(400).json({
        success: false,
        error: "Aadhaar already registered",
      });
    }

    // Generate password
    const rawPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    // Create user + staff
    const staff = await prisma.staff.create({
      data: {
        user: {
          create: {
            email,
            password: hashedPassword,
            name,
            phone,
            role: "STAFF",
          },
        },
        skill,
        category,
        experience,
        salary: {
          amount: Number(salary),
          lastRevisionDate: null,
          revisions: [],
          adjustments: [],
        },
        shift,
        gender,
        aadhaar,
        address,
        registrationNo,
        department,
        staffCode,
        joiningDate,
        roleBadge,
      },
      include: { user: true },
    });

    // Send credentials
    await sendCredentialsEmail(email, {
      name,
      email,
      password: rawPassword,
      loginUrl: `${process.env.CLIENT_URL}/login`,
    });

    res.status(201).json({
      success: true,
      message: "Staff created successfully",
      data: {
        ...staff,
        password: rawPassword // dev/testing only
      }
    });    
  } catch (error) {
    next(error);
  }
};

// GET STAFF PROFILE

exports.getStaffProfile = async (req, res, next) => {
  try {
    const { staffId } = req.params;

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { user: true },
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: "Staff not found",
      });
    }

    // Staff can view only own profile
    if (req.user.role === "STAFF" && req.user.id !== staff.userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};


// GET ALL STAFF (ADMIN only)

exports.getAllStaff = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Only Admin can view all staff",
      });
    }
    //pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const status = req.query.status; // "active" | "inactive"
    let isActiveFilter = true;
    if (status === "inactive") {
      isActiveFilter = false;
    }
    const staff = await prisma.staff.findMany({
      skip,
      take: limit,
      where: {
        user: {
          isActive: isActiveFilter,
        },
      },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      page,
      limit,
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};


// UPDATE STAFF

exports.updateStaff = async (req, res, next) => {
  try {
    const { staffId } = req.params;

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { user: true },
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: "Staff not found",
      });
    }

    const isAdmin = req.user.role === "ADMIN";
    const isSelf = req.user.role === "STAFF" && req.user.id === staff.userId;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    const {
      name,
      phone,
      skill,
      category,
      experience,
      salary,
      shift,
      gender,
      aadhaar,
      address,
      registrationNo,
      department,
      staffCode,
      joiningDate,
      roleBadge,
    } = req.body;

    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: {
        skill,
        category,
        experience,
        shift,
        gender,
        aadhaar,
        address,
        registrationNo,
        department,
        staffCode,
        joiningDate,
        roleBadge,
        salary: salary
          ? {
              amount: Number(salary),
            }
          : undefined,
        user: { update: { name, phone } },
      },
      include: { user: true },
    });

    res.json({
      success: true,
      message: "Staff updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// ADMIN UPDATE STAFF PASSWORD

exports.adminUpdateStaffPassword = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Only Admin can update staff password",
      });
    }

    const { staffId } = req.params;
    const { newPassword } = req.body;

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: "Staff not found",
      });
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: staff.userId },
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

// DISABLE STAFF (ADMIN only)
exports.disableStaff = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Only Admin can disable staff",
      });
    }

    const { staffId } = req.params;

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: "Staff not found",
      });
    }

    await prisma.user.update({
      where: { id: staff.userId },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: "Staff disabled successfully",
    });
  } catch (error) {
    next(error);
  }
};

