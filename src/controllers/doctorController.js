const bcrypt = require("bcryptjs");
const prisma = require("../config/db");
const { sendCredentialsEmail } = require("../services/emailServices");
const { generatePassword } = require("../utils/otpServices");

// =====================================================================
// CREATE DOCTOR (ADMIN only)
// =====================================================================
exports. createDoctor = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Only Admin can create a doctor",
      });
    }

    const {
      name,
      email,
      phone,
      qualification,
      registrationNo,
      salary,
      shift,
      gender,
      department,
      aadhaar,
      address,
      experience,
      consultationFee,
      availabilityDays,
      documentUrl,
    } = req.body;

    // Check email exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Email already registered",
      });
    }

    // Generate password
    const rawPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    // Create user + doctor profile
    const doctor = await prisma.doctor.create({
      data: {
        user: {
          create: {
            email,
            password: hashedPassword,
            name,
            phone,
            role: "DOCTOR",
          },
        },
        qualification,
        registrationNo,
        salary: Number(salary),
        shift,
        gender,
        department,
        aadhaar,
        address,
        experience,
        consultationFee: consultationFee ? Number(consultationFee) : null,
        availabilityDays,
        documentUrl,
      },
      include: {
        user: true,
      },
    });

    // Send credentials via email
    // await sendCredentialsEmail(email, {
    //   name,
    //   email,
    //   password: rawPassword,
    //   loginUrl: `${process.env.CLIENT_URL}/login`,
    // });

    res.status(201).json({
      success: true,
      message: "Doctor created successfully",
      data: {
        ...doctor,
        password: rawPassword, // return for dev/testing
      },
    });
  } catch (error) {
    next(error);
  }
};


exports.getDoctorProfile = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });

    if (!doctor)
      return res.status(404).json({ success: false, error: "Doctor not found" });

    // Doctor can view their own profile
    if (req.user.role === "DOCTOR" && req.user.id !== doctor.userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    res.json({ success: true, data: doctor });
  } catch (error) {
    next(error);
  }
};

exports.getAllDoctors = async (req, res, next) => {
  try {
    const allowedRoles = ["ADMIN", "RECEPTIONIST", "PATIENT"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "You are not allowed to view doctors",
      });
    }

    const status = req.query.status ?? "active";
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 10); // cap limit

    let userFilter = {};
    if (status === "active") userFilter.isActive = true;
    else if (status === "inactive") userFilter.isActive = false;

    const where = { user: userFilter };

    const [total, doctors] = await Promise.all([
      prisma.doctor.count({ where }),
      prisma.doctor.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          qualification: true,
          experience: true,
          department: true,
          shift: true,
          consultationFee: true,
          availabilityDays: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isActive: true,
            },
          },
        },
        orderBy: { user: { name: "asc" } },
      }),
    ]);

    return res.status(200).json({
      success: true,
      code: "DOCTORS_FETCHED",
      message: "Doctors fetched successfully",
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: doctors,
    });
  } catch (error) {
    next(error);
  }
};


exports.updateDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });

    if (!doctor)
      return res.status(404).json({ success: false, error: "Doctor not found" });

    const isAdmin = req.user.role === "ADMIN";
    const isSelf = req.user.role === "DOCTOR" && req.user.id === doctor.userId;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const {
      name,
      phone,
      qualification,
      registrationNo,
      salary,
      shift,
      gender,
      department,
      aadhaar,
      address,
      experience,
      consultationFee,
      availabilityDays,
      documentUrl,
    } = req.body;

    // Doctor can edit limited fields
    if (isSelf) {
      const updated = await prisma.doctor.update({
        where: { id: doctorId },
        data: {
          experience,
          address,
          documentUrl,
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
    const updated = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        qualification,
        registrationNo,
        salary,
        shift,
        gender,
        department,
        aadhaar,
        address,
        experience,
        consultationFee,
        availabilityDays,
        documentUrl,
        user: { update: { name, phone } },
      },
      include: { user: true },
    });

    res.json({ success: true, message: "Doctor updated", data: updated });
  } catch (error) {
    next(error);
  }
};

exports.adminUpdateDoctorPassword = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Only Admin can update doctor password",
      });
    }

    const { doctorId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: "New password is required",
      });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });

    if (!doctor)
      return res.status(404).json({ success: false, error: "Doctor not found" });

    const hashed = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: doctor.userId },
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

exports.disableDoctor = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "Only Admin can update doctor status",
      });
    }

    const { doctorId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        code: "INVALID_INPUT",
        message: "isActive must be true or false",
      });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        code: "DOCTOR_NOT_FOUND",
        message: "Doctor not found",
      });
    }

    await prisma.user.update({
      where: { id: doctor.userId },
      data: { isActive },
    });

    return res.status(200).json({
      success: true,
      code: "DOCTOR_STATUS_UPDATED",
      message: `Doctor has been ${isActive ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    next(error);
  }
};
