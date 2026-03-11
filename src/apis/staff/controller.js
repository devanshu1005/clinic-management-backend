const bcrypt = require("bcryptjs");
const { User, Staff } = require("../../models");
const { generatePassword } = require("../../utils/otpServices");

//CREATE STAFF (ADMIN ONLY)

exports.createStaff = async ({ user, body }) => {
    if (user.role !== "ADMIN") {
        return {
            statusCode: 403,
            success: false,
            message: "Only Admin can create staff",
        };
    }

    const{
     name,
      email,
      phone,
      password,
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
    } = body;

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

        //Generate password
        const rawPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(rawPassword, 12);

        //create user
        const userDetails = await User.create({
            email,
            name:name,
            password: hashedPassword,
            role: "STAFF",
            lastLogin: new Date(),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        //create staff
        
        const staff = await Staff.create({
            user: userDetails._id,
            admin: user._id,
            skill,
            phone,
            category,
            experience,
            salary: Number(salary),
            shift,
            gender,
            aadhaar,
            address,
            registrationNo,
            department,
            staffCode,
            joiningDate,
            roleBadge,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    if(!staff){
        return{
            statusCode:500,
            success:false,
            message:"Failed to create staff"
        }
    }else{
        return{
            statusCode:200,
            success:true,
            message:"staff created successfully",
            data:{
                ...staff.toObject(),
                password:rawPassword
            }
        }
    }}


    //staff login

    const jwt = require("jsonwebtoken");
    
    exports.stafflogin = async ({ body }) => {
      const { email, password } = body;
    
      const user = await User.findOne({ email, role: "STAFF" });
    
      if (!user) {
        throw new Error("staff not found");
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

    //get Staff profile
exports.getStaffProfile = async ({ user, params }) => {
  const { staffId } = params;

  const staff = await Staff.findById(staffId).populate("user").lean();
  console.log(staff,"Staff")

  if (!staff)
    return {
      statusCode: 404,
      success: false,
      message: "Staff not found",
    };

  // Staff can view their own profile
  if (user.role === "STAFF" && user.id !== Staff.user.id) {
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
       // ...Staff.toObject(),
      ...staff,      
      isActive: staff.user.isActive
    },
  };
};


//get isactive Staff

exports.getisActiveStaff = async ({ user, query }) => {
  const allowedRoles = ["ADMIN"];
  if (!allowedRoles.includes(user.role)) {
    return {
      statusCode: 403,
      success: false,
      code: "FORBIDDEN",
      message: "You are not allowed to view Staffs",
    };
  }

  const status = query.status 
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Number(query.limit) || 10); 

  let userFilter = {};
  if (status === "active") userFilter.isActive = true;
  

  const filter = {
    admin: user.role === "ADMIN" ? user._id : undefined,
  };

  const [total, staff] = await Promise.all([
    Staff.countDocuments(filter),

    Staff.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .select(
        "user experience salary shift gender aadhaar address deskNumber shiftTiming canEditPatient createdAt",
      )
      .populate({
        path: "user",
        match: {isActive:true},
        select: "name email phone isActive",
      })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const filteredStaff = staff.filter((d) => d.user);
  return {
    statusCode: 200,
    success: true,
    code: "Active STAFF FETCHED",
    message: " Active STAFF fetched successfully",
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: filteredStaff,
  };
};

//get inactive staff

exports.getinActiveStaff = async ({ user, query }) => {
  const allowedRoles = ["ADMIN"];
  if (!allowedRoles.includes(user.role)) {
    return {
      statusCode: 403,
      success: false,
      code: "FORBIDDEN",
      message: "You are not allowed to view Staff",
    };
  }

  const status = query.status 
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Number(query.limit) || 10); // cap limit

  let userFilter = {};
  if (status === "active") userFilter.isActive = false;
  //else if (status === "inactive") userFilter.isActive = false;

  const filter = {
    admin: user.role === "ADMIN" ? user._id : undefined,
  };

  const [total, staff] = await Promise.all([
    Staff.countDocuments(filter),

    Staff.find(filter)
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

  const filteredStaff = staff.filter((d) => d.user);
  return {
    statusCode: 200,
    success: true,
    code: "inActive STAFF_FETCHED",
    message: " inActive Staff fetched successfully",
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: filteredStaff,
  };
};

//get all Staff
exports.getAllStaff = async ({ user, query }) => {
  const allowedRoles = ["ADMIN"];
  if (!allowedRoles.includes(user.role)) {
    return {
      statusCode: 403,
      success: false,
      code: "FORBIDDEN",
      message: "You are not allowed to view Staff",
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

  const [total, staff] = await Promise.all([
   Staff.countDocuments(filter),

   Staff.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .select(
        "user experience salary shift gender aadhaar address deskNumber shiftTiming canEditPatient createdAt",
      )
      .populate({
        path: "user",
        match: userFilter,
        select: "name email phone isActive",
      })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const filteredStaff = staff.filter((d) => d.user);
  return {
    statusCode: 200,
    success: true,
    code: "STAFF_FETCHED",
    message: "Staff fetched successfully",
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: filteredStaff,
  };
};

//admin can update staff password
exports.adminUpdatestaffPassword = async ({ user, params, body }) => {
  if (user.role !== "ADMIN") {
    return {
      statusCode: 403,
      success: false,
      message: "Only Admin can update staff password",
    };
  }
  const { staffId } = params;
  const { newPassword } = body;

  
  const staff = await Staff.findById(staffId).populate("user");

  if ( !staff)
    return {
      statusCode: 404,
      success: false,
      message:  "staff not found",
    };

  const hashed = await bcrypt.hash(newPassword, 12);

  await User.findByIdAndUpdate( staff.user._id, { password: hashed });

  return {
    statusCode: 200,
    success: true,
    message: "Password updated successfully",
  };
};


//disable staff (we ar enot deleting staff for future use)
exports.disableStaff = async ({ user, params, body }) => {
  if (user.role !== "ADMIN") {
    return {
      statusCode: 403,
      success: false,
      code: "FORBIDDEN",
      message: "Only Admin can update staff status",
    };
  }

 const { staffId } = params;
  const { isActive } = body;

  const staff = await Staff.findById (staffId).populate("user");

  if ( !staff) {
    return {
      statusCode: 404,
      success: false,
      code:  "STAFF_NOT_FOUND",
      message:  "staff not found",
    };
  }
    await User.findByIdAndUpdate(
   staff.user._id,
    { isActive },
    { new: true, runValidators: true }
  );

  await User.findByIdAndUpdate(staff.user._id, { isActive });

  return {
    statusCode: 200,
    success: true,
    code:  "STAFF_STATUS_UPDATED",
    message:  `staff has been ${isActive ? "activated" : "inactive"} successfully`,
  };
};

// admmin(full access) AND Staff (limited update) can update Staff
exports.updateStaff = async ({ user, params, body }) => {
const { staffId } = params;

  const staff = await Staff.findById (staffId).populate("user");

  if (!staff)
    return {
      statusCode: 404,
      success: false,
      message: "Staff not found",
    };
  


  const isAdmin = user.role === "ADMIN";
  const isSelf = user.role === "STAFF" ;
  

  if (!isAdmin && !isSelf) {
    return {
      statusCode: 403,
      success: false,
      message: "Access denied",
    };
  }

  const {
      name,
      email,
      phone,
      password,
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

  } = body;
  
 
  // Staff can edit limited fields
  if (isSelf) {
      // allowed fields for Staff
    const allowedFields = ["experience", "address", "name", "phone"];

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


    await Staff.findByIdAndUpdate(
      staffId,
      {
        experience,
        address,
    
      },
      { new: true, runValidators: true },
    );
    

    await User.findByIdAndUpdate(
      staff.user._id,
      {
        name,
        phone,
      },
      { runValidators: true },
    );
    

    const updated = await Staff.findById(staffId).populate("user").lean();

    return {
      statusCode: 200,
      success: true,
      message: "Profile updated",
      data: updated,
    };
  }

  // Admin can edit everything
  await Staff.findByIdAndUpdate(
    staffId,
    {
      name,
      email,
      phone,
      password,
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

    },
    { new: true, runValidators: true },
  );
  
  await User.findByIdAndUpdate(
    staff.user._id,
    {
      name,
      phone,
    },
    { runValidators: true },
  );
  
const updated = await Staff.findById(staffId).populate("user").lean();

  return {
    statusCode: 200,
    success: true,
    message: "Staff updated",
    data: updated,
  };
};



