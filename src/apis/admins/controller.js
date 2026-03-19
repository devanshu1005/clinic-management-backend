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

  const { email, name, phone, clinicName, location } = body;

  const existingUser = await User.findOne({ email }).select("id").lean();
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
    name: name,
    phone,
    role: "ADMIN",
  });

  const admin = await Admin.create({
    user: userDetails._id,
    clinicName,
    location,
    subsValidity: subscriptionExpiry,
  });
await User.findByIdAndUpdate(userDetails._id, {
  admin: admin._id
});
console.log("Saved admin reference:", userDetails.admin);
console.log("User created:", userDetails);
console.log("Admin created:", admin);

  return {
    statusCode: 201,
    success: true,
    message: "Admin created successfully.",
    data: {
      id: userDetails.id,
      name: userDetails.name,
      email: userDetails.email,
      phone: userDetails.phone,
      role: userDetails.role,
      clinic: {
        id: admin.id,
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
   console.log("User received in controller:", user);
   if (!user || !user.id) {
    throw new Error("User information missing in request");
  }
  const userDetails = await User.findById(user.id)
  
 // .select("name email phone role isActive lastLogin createdAt id")  

    // .populate({
    //   path: "admin",
    //   select: "clinicName location subsValidity createdAt",
    // })
      if (!userDetails) {
    throw new Error("User not found");
  }

  const admin = await Admin.findOne({ user: userDetails._id });
  console.log("Admin found:", admin);
  if (admin) {
    userDetails.admin = {
      id: admin.id,
      clinicName: admin.clinicName,
      location: admin.location,
      subsValidity: admin.subsValidity,
    };
  }

  return {
    statusCode: 200,
    success: true,
    data: {
      id: userDetails.id,
      name: userDetails.name,
      email: userDetails.email,
      phone: userDetails.phone,
      role: userDetails.role,
      isActive: userDetails.isActive,
      lastLogin: userDetails.lastLogin,
      createdAt: userDetails.createdAt,
      clinic: userDetails.admin
        ? {
            id: userDetails.admin.id,
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
    // .populate({
    //   path: "adminId",
    //   select: "clinicName location subsValidity",
    // })
    .lean();

  if (!userDetails || userDetails.role !== "ADMIN") {
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
      clinic: userDetails.adminId,
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
  if (!body) {
    return {
      statusCode: 400,
      success: false,
      message: "Request body is missing"
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
    message: `Admin has been ${isActive ? "activated" : "inactivated"} successfully`,
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


//admin log in 
const jwt = require("jsonwebtoken");

exports.adminLogin = async ({ body }) => {
  const { email, password } = body;

  const user = await User.findOne({ email, role: "ADMIN" });

  if (!user) {
    throw new Error("Admin not found");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    statusCode: 200,
    success: true,
    token
  };
};



// UPDATE ADMIN INFO

exports.updateAdminInfo = async ({ user, params, body }) => {
  if (user.role !== "SUPER_ADMIN") {
    return {
      statusCode: 403,
      success: false,
      message: "Only Super Admin can update admin information",
    };
  }

  const { adminId } = params;
  const { adminName, subsValidity, isActive } = body;

  const adminUser = await User.findById(adminId).select(
    "name email phone role isActive admin"
  );

  if (!adminUser || adminUser.role !== "ADMIN") {
    return {
      statusCode: 404,
      success: false,
      message: "Admin not found",
    };
  }

  // Update USER fields 
  if (adminName) adminUser.name = adminName;
  if (typeof isActive === "boolean") adminUser.isActive = isActive;

  await adminUser.save();

  // Update ADMIN profile 
  if (subsValidity && adminUser.admin) {
    await Admin.findByIdAndUpdate(adminUser.admin, {
      subsValidity: new Date(subsValidity),
    });
  }

  // Fetch updated data with populate 
  const updatedUser = await User.findById(adminId)
    .select("name email phone role isActive updatedAt")
    // .populate({
    //   path: "admin",
    //   select: "clinicName location subsValidity",
    // })
    .lean();

  return {
    statusCode: 200,
    success: true,
    message: "Admin info updated successfully",
    data: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      updatedAt: updatedUser.updatedAt,
      clinic: updatedUser.admin
        ? {
            id: updatedUser.admin.id,
            clinicName: updatedUser.admin.clinicName,
            location: updatedUser.admin.location,
            subsValidity: updatedUser.admin.subsValidity,
          }
        : null,
    },
  };
};
