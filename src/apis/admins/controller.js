const bcrypt = require("bcryptjs");
const { User, Admin } = require("../../models");
const { generatePassword } = require("../../utils/otpServices");

// =============================================
// CREATE ADMIN
// =============================================
exports.createAdmin = async ({ body, user }) => {
  if (user.role !== "SUPER_ADMIN") {
    return {
      statusCode: 403,
      success: false,
      message: "Only Super Admin can create admins",
    };
  }

  const { email, adminName, phone, clinicName, location } = body;

  const existingUser = await User.findOne({ email }).select("_id").lean();
  if (existingUser) {
    return {
      statusCode: 400,
      success: false,
      message: "Email is already registered",
    };
  }

  const generatedPassword = generatePassword();
  const hashedPassword = await bcrypt.hash(generatedPassword, 12);

  const subscriptionExpiry = new Date();
  subscriptionExpiry.setMonth(subscriptionExpiry.getMonth() + 1);

  const userDetails = await User.create({
    email,
    password: hashedPassword,
    name: adminName,
    phone,
    role: "ADMIN",
  });

  const admin = await Admin.create({
    user: userDetails._id,
    clinicName,
    location,
    subsValidity: subscriptionExpiry,
  });

  return {
    statusCode: 201,
    success: true,
    message: "Admin created successfully.",
    data: {
      id: userDetails._id,
      name: userDetails.name,
      email: userDetails.email,
      phone: userDetails.phone,
      role: userDetails.role,
      clinic: {
        id: admin._id,
        clinicName: admin.clinicName,
        location: admin.location,
        subsValidity: admin.subsValidity,
      },
      temporaryPassword: generatedPassword,
    },
  };
};

// =============================================
// GET CURRENT USER
// =============================================
exports.getMe = async ({ user }) => {
  const userDetails = await User.findById(user.id)
    .select("name email phone role isActive lastLogin createdAt")
    .populate({
      path: "admin",
      select: "clinicName location subsValidity createdAt",
    })
    .lean();

  return {
    statusCode: 200,
    success: true,
    data: {
      id: userDetails._id,
      name: userDetails.name,
      email: userDetails.email,
      phone: userDetails.phone,
      role: userDetails.role,
      isActive: userDetails.isActive,
      lastLogin: userDetails.lastLogin,
      createdAt: userDetails.createdAt,
      clinic: userDetails.admin
        ? {
            id: userDetails.admin._id,
            clinicName: userDetails.admin.clinicName,
            location: userDetails.admin.location,
            subsValidity: userDetails.admin.subsValidity,
          }
        : null,
    },
  };
};

// =============================================
// GET ALL ADMINS
// =============================================
exports.getAllAdmins = async ({ user, query }) => {
  if (user.role !== "SUPER_ADMIN") {
    return {
      statusCode: 403,
      success: false,
      code: "FORBIDDEN",
      message: "Only Super Admin can view admins",
    };
  }

  const { status = "active", page = 1, limit = 10 } = query;

  const pageNumber = Math.max(1, Number(page));
  const pageSize = Math.min(50, Number(limit));
  const skip = (pageNumber - 1) * pageSize;

  let userFilter = {};
  if (status === "active") userFilter.isActive = true;
  if (status === "inactive") userFilter.isActive = false;

  const admins = await Admin.find()
    .select("clinicName location subsValidity createdAt user")
    .populate({
      path: "user",
      match: userFilter,
      select: "name email phone role isActive createdAt",
    })
    .skip(skip)
    .limit(pageSize)
    .sort({ createdAt: -1 })
    .lean();

  const filtered = admins.filter((a) => a.user);

  const total = await Admin.countDocuments();

  const data = filtered.map((a) => ({
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
      subsValidity: a.subsValidity,
    },
  }));

  return {
    statusCode: 200,
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
  };
};

// =============================================
// GET ADMIN BY ID
// =============================================
exports.getAdminById = async ({ user, params }) => {
  if (user.role !== "SUPER_ADMIN") {
    return {
      statusCode: 403,
      success: false,
      error: "Only Super Admin can view admin details",
    };
  }

  const userDetails = await User.findById(params.id)
    .select("name email phone role isActive createdAt")
    .populate({
      path: "admin",
      select: "clinicName location subsValidity",
    })
    .lean();

  if (!user || user.role !== "ADMIN") {
    return {
      statusCode: 404,
      success: false,
      error: "Admin not found",
    };
  }

  return {
    statusCode: 200,
    success: true,
    data: {
      id: userDetails._id,
      name: userDetails.name,
      email: userDetails.email,
      phone: userDetails.phone,
      role: userDetails.role,
      isActive: userDetails.isActive,
      createdAt: userDetails.createdAt,
      clinic: userDetails.admin,
    },
  };
};

// =============================================
// DISABLE ADMIN
// =============================================
exports.disableAdmin = async ({ user, params, body }) => {
  if (user.role !== "SUPER_ADMIN") {
    return {
      statusCode: 403,
      success: false,
      code: "FORBIDDEN",
      message: "Only Super Admin can update admin status",
    };
  }

  const { adminId } = params;
  const { isActive } = body;

  const admin = await Admin.findOne({ user: adminId }).select("user").lean();

  if (!admin) {
    return {
      statusCode: 404,
      success: false,
      code: "ADMIN_NOT_FOUND",
      message: "Admin not found",
    };
  }

  if (admin.user.toString() === user.id) {
    return {
      statusCode: 400,
      success: false,
      message: "You cannot deactivate yourself",
    };
  }

  await User.findByIdAndUpdate(adminId, { isActive }, { runValidators: true });

  return {
    statusCode: 200,
    success: true,
    message: `Admin has been ${isActive ? "activated" : "deactivated"} successfully`,
  };
};  

// =============================================
// UPDATE ADMIN PASSWORD
// =============================================
exports.updateAdminPassword = async ({ user, params, body }) => {
  if (user.role !== "SUPER_ADMIN") {
    return {
      statusCode: 403,
      success: false,
      error: "Only Super Admin can update admin password",
    };
  }

  const admin = await User.findById(params.adminId).select("role");

  if (!admin || admin.role !== "ADMIN") {
    return {
      statusCode: 404,
      success: false,
      error: "Admin not found",
    };
  }

  const hashedPassword = await bcrypt.hash(body.newPassword, 12);

  await User.findByIdAndUpdate(
    params.adminId,
    { password: hashedPassword },
    { runValidators: true },
  );

  return {
    statusCode: 200,
    success: true,
    message: "Admin password updated successfully",
  };
};
