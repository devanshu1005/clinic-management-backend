const bcrypt = require("bcryptjs");
const { User, Doctor } = require("../../models");
const { generatePassword } = require("../../utils/otpServices");

// CREATE DOCTOR (ADMIN only)

exports.createDoctor = async ({ user, body }) => {
  if (user.role !== "ADMIN") {
    return {
      statusCode: 403,
      success: false,
      message: "Only Admin can create a doctor",
    };
  }

  const {
    name,
    email,
    phone,
    password,
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
  } = body;

  // Check email exists
    // Check email exists
    const Emailexist = await User.findOne({ email });
    if (Emailexist) {
        return {
            statusCode: 400,
            success: false,
            message: "Email already registered",
        };
    }

        const Aadhaarexist = await User.findOne({ aadhaar });
    if (Aadhaarexist) {
        return {
            statusCode: 400,
            success: false,
            message: "Aadhar already registered",
        };
    }

        const Phoneexist = await User.findOne({ phone });
    if (Phoneexist) {
        return {
            statusCode: 400,
            success: false,
            message: "Phone already registered",
        };
    }

  // Generate password
  const rawPassword = generatePassword();
  const hashedPassword = await bcrypt.hash(rawPassword, 12);

  // Create user
  const userDetails = await User.create({
    email,
    password: hashedPassword,
    name,
    phone,
    role: "DOCTOR",
      isActive:true,
        lastLogin:new Date(),
        createdAt:new Date()
  });

  // Create doctor
  const doctor = await Doctor.create({
    user: userDetails._id,
    admin: user._id,
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
  });

  if (!doctor) {
    return {
      statusCode: 500,
      success: false,
      message: "Failed to create doctor",
    };
  }
  return {
    statusCode: 201,
    success: true,
    message: "Doctor created successfully",
    data: {
      ...doctor.toObject(),
      password: rawPassword,
    },
  };
};
//get doctor profile
exports.getDoctorProfile = async ({ user, params }) => {
  const { doctorId } = params;

  const doctor = await Doctor.findById(doctorId).populate("user").lean();

  if (!doctor)
    return {
      statusCode: 404,
      success: false,
      message: "Doctor not found",
    };

  // Doctor can view their own profile
  if (user.role === "DOCTOR" && user.id !== doctor.user.id) {
    return {
      statusCode: 403,
      success: false,
      message: "Access denied",
    };
  }

 return {
    statusCode: 200,
    success: true,
    data: {
      ...doctor,
      isActive: doctor.user.isActive
    },
  };
};
//get all doctors(with pagination)
exports.getAllDoctors = async ({ user, query }) => {
  const allowedRoles = ["ADMIN", "RECEPTIONIST", "PATIENT"];
  if (!allowedRoles.includes(user.role)) {
    return {
      statusCode: 403,
      success: false,
      code: "FORBIDDEN",
      message: "You are not allowed to view doctors",
    };
  }

  const status = query.status 
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Number(query.limit) || 10); // cap limit

  let userFilter = {};
  if (status === "active") userFilter.isActive = true;
  else if (status === "inactive") userFilter.isActive = false;

  const filter = {
    admin: user.role === "ADMIN" ? user._id : undefined,
  };

  const [total, doctors] = await Promise.all([
    Doctor.countDocuments(filter),

    Doctor.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .select(
        "qualification experience department shift consultationFee availabilityDays",
      )
      .populate({
        path: "user",
        match: userFilter,
        select: "name email phone isActive",
      })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const filteredDoctors = doctors.filter((d) => d.user);
  return {
    statusCode: 200,
    success: true,
    code: "DOCTORS_FETCHED",
    message: "Doctors fetched successfully",
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: filteredDoctors,
  };
};

// admmin(full access) AND DOCTOR (limited update) can update doctor
exports.updateDoctor = async ({ user, params, body }) => {
  const { doctorId } = params;

  const doctor = await Doctor.findById(doctorId).populate("user");

  if (!doctor)
    return {
      statusCode: 404,
      success: false,
      message: "Doctor not found",
    };
  


  const isAdmin = user.role === "ADMIN";
  const isSelf = user.role === "DOCTOR" 
  //user._id.toString() === doctor.user._id.toString();

  if (!isAdmin && !isSelf) {
    return {
      statusCode: 403,
      success: false,
      message: "Access denied",
    };
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
  } = body;
 
  // Doctor can edit limited fields
  if (isSelf) {
          // allowed fields for receptionist
    const allowedFields = ["experience", "address","documentUrl", "name", "phone"];

    // check if body contains forbidden fields
    const invalidField = Object.keys(body).find(
      (key) => !allowedFields.includes(key)
    );

    if (invalidField) {
      return {
        statusCode: 403,
        success: false,
        message: `You are not authorised to update ${invalidField}. Only admin can update this field`,
      };
    }
    await Doctor.findByIdAndUpdate(
      doctorId,
      {
        experience,
        address,
        documentUrl,
      },
      { new: true, runValidators: true },
    );

    await User.findByIdAndUpdate(
      doctor.user._id,
      {
        name,
        phone,
      },
      { runValidators: true },
    );

    const updated = await Doctor.findById(doctorId).populate("user").lean();

    return {
      statusCode: 200,
      success: true,
      message: "Profile updated",
      data: updated,
    };
  }

  // Admin can edit everything
  await Doctor.findByIdAndUpdate(
    doctorId,
    {email,
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
    },
    { new: true, runValidators: true },
  );
  
  await User.findByIdAndUpdate(
    doctor.user._id,
    {
      name,
      phone,
    },
    { runValidators: true },
  );

  const updated = await Doctor.findById(doctorId).populate("user").lean();

  return {
    statusCode: 200,
    success: true,
    message: "Doctor updated",
    data: updated,
  };
};

//admin can update doctor password
exports.adminUpdateDoctorPassword = async ({ user, params, body }) => {
  if (user.role !== "ADMIN") {
    return {
      statusCode: 403,
      success: false,
      message: "Only Admin can update doctor password",
    };
  }

  const { doctorId } = params;
  const { newPassword } = body;

  const doctor = await Doctor.findById(doctorId).populate("user");

  if (!doctor)
    return {
      statusCode: 404,
      success: false,
      message: "Doctor not found",
    };

  const hashed = await bcrypt.hash(newPassword, 12);

  await User.findByIdAndUpdate(doctor.user._id, { password: hashed });

  return {
    statusCode: 200,
    success: true,
    message: "Password updated successfully",
  };
};

//disable doctor (we ar enot deleting doctor for future use)
exports.disableDoctor = async ({ user, params, body }) => {
  if (user.role !== "ADMIN") {
    return {
      statusCode: 403,
      success: false,
      code: "FORBIDDEN",
      message: "Only Admin can update doctor status",
    };
  }

  const { doctorId } = params;
  const { isActive } = body;

  const doctor = await Doctor.findById(doctorId).populate("user");

  if (!doctor) {
    return {
      statusCode: 404,
      success: false,
      code: "DOCTOR_NOT_FOUND",
      message: "Doctor not found",
    };
  }
    await User.findByIdAndUpdate(
    doctor.user._id,
    { isActive },
    { new: true, runValidators: true }
  );



  await User.findByIdAndUpdate(doctor.user.id, { isActive });

  return {
    statusCode: 200,
    success: true,
    code: "DOCTOR_STATUS_UPDATED",
    message: `Doctor has been ${isActive ? "activated" : "inactive"} successfully`,
  };
};

//doctor log in
const jwt = require("jsonwebtoken");

exports.doctorLogin = async ({ body }) => {
  const { email, password } = body;

  const user = await User.findOne({ email, role: "DOCTOR" });

  if (!user) {
    throw new Error("Doctor not found");
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

//get isactive doctor

exports.getisActiveDoctors = async ({ user, query }) => {
  const allowedRoles = ["ADMIN", "RECEPTIONIST", "PATIENT"];
  if (!allowedRoles.includes(user.role)) {
    return {
      statusCode: 403,
      success: false,
      code: "FORBIDDEN",
      message: "You are not allowed to view doctors",
    };
  }

  const status = query.status 
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Number(query.limit) || 10); // cap limit

  let userFilter = {};
  if (status === "active") userFilter.isActive = true;
  //else if (status === "inactive") userFilter.isActive = false;

  const filter = {
    admin: user.role === "ADMIN" ? user._id : undefined,
  };

  const [total, doctors] = await Promise.all([
    Doctor.countDocuments(filter),

    Doctor.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .select(
        "qualification experience department shift consultationFee availabilityDays",
      )
      .populate({
        path: "user",
        match: {isActive:true},
        select: "name email phone isActive",
      })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const filteredDoctors = doctors.filter((d) => d.user);
  return {
    statusCode: 200,
    success: true,
    code: "Active DOCTORS_FETCHED",
    message: " Active Doctors fetched successfully",
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: filteredDoctors,
  };
};

//get inactive doctor

exports.getinActiveDoctors = async ({ user, query }) => {
  const allowedRoles = ["ADMIN", "RECEPTIONIST", "PATIENT"];
  if (!allowedRoles.includes(user.role)) {
    return {
      statusCode: 403,
      success: false,
      code: "FORBIDDEN",
      message: "You are not allowed to view doctors",
    };
  }

  const status = query.status 
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Number(query.limit) || 10); // cap limit

  let userFilter = {};
  if (status === "active") userFilter.isActive = False;
  //else if (status === "inactive") userFilter.isActive = false;

  const filter = {
    admin: user.role === "ADMIN" ? user._id : undefined,
  };

  const [total, doctors] = await Promise.all([
    Doctor.countDocuments(filter),

    Doctor.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .select(
        "qualification experience department shift consultationFee availabilityDays",
      )
      .populate({
        path: "user",
        match: {isActive:false},
        select: "name email phone isActive",
      })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const filteredDoctors = doctors.filter((d) => d.user);
  return {
    statusCode: 200,
    success: true,
    code: "inActive DOCTORS_FETCHED",
    message: " inActive Doctors fetched successfully",
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: filteredDoctors,
  };
};