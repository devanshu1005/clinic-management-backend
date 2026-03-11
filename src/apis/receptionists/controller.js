const bcrypt = require("bcryptjs");
const { User, Receptionist } = require("../../models");
const { generatePassword } = require("../../utils/otpServices");

//CREATE RECEPTIONIST (ADMIN only)

exports.createReceptionist = async ({ user, body }) => {
    if (user.role !== "ADMIN") {
        return {
            statusCode: 403,
            success: false,
            message: "Only Admin can create a receptionist",
        };
    }
    const{
     name,
      email,
      phone,
      password,
      experience,
      salary,
      shift,
      gender,
      aadhaar,
      address,
      deskNumber,
      shiftTiming,
      canEditPatient 

    } = body;
    
    //check email existing

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

    //Generate Password
    const rawPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(rawPassword,12);

    //create user

    const userDetails = await User.create({
        email,
        password:hashedPassword,
        name:name,
        phone:phone,
        role:"RECEPTIONIST",
        isActive:true,
        lastLogin:new Date(),
        createdAt:new Date(),
        updatedAt:new Date()
    })

    //create receptionist 

    const receptionist = await Receptionist.create({
        user:userDetails._id,
        admin:user._id,
        experience,
        salary :Number(salary),
        shift,
        gender,
        aadhaar,
        address,
        deskNumber,
        shiftTiming,
        canEditPatient
    });

    if(!receptionist){
        return{
            statusCode:500,
            success:false,
            message:"Failed to create Receptionist"
        }
    }else{
        return{
            statusCode:200,
            success:true,
            message:"Receptionist created successfully",
            data:{
                ...receptionist.toObject(),
                password:rawPassword
            }
        }
    }
}
  
//receptionist login
const jwt = require("jsonwebtoken");

exports.receptionistLogin = async ({ body }) => {
  const { email, password } = body;

  const user = await User.findOne({ email, role: "RECEPTIONIST" });

  if (!user) {
    throw new Error("Receptionist not found");
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

//get Receptionist profile
exports.getReceptionistProfile = async ({ user, params }) => {
  const { receptionistId } = params;

  const receptionist = await Receptionist.findById(receptionistId).populate("user").lean();
  console.log(receptionist,"receptionist")

  if (!receptionist)
    return {
      statusCode: 404,
      success: false,
      message: "Receptionist not found",
    };

  // Receptionist can view their own profile
  if (user.role === "RECEPTIONIST" && user.id !== receptionist.user.id) {
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
       // ...receptionist.toObject(),
      ...receptionist,       //we create .toObject() method in create receptionist but when we create in this it shows error function not defined but this means yehi na ki mongoose special onject ko javascript  special onject  mai convert kr deta hai


      isActive: receptionist.user.isActive
    },
  };
};

//get isactive receptionist

exports.getisActiveReceptionists = async ({ user, query }) => {
  const allowedRoles = ["ADMIN"];
  if (!allowedRoles.includes(user.role)) {
    return {
      statusCode: 403,
      success: false,
      code: "FORBIDDEN",
      message: "You are not allowed to view receptionists",
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

  const [total, receptionists] = await Promise.all([
    Receptionist.countDocuments(filter),

    Receptionist.find(filter)
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

  const filteredReceptionists = receptionists.filter((d) => d.user);
  return {
    statusCode: 200,
    success: true,
    code: "Active RECEPTIONISTS FETCHED",
    message: " Active RECEPTIONISTS fetched successfully",
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: filteredReceptionists,
  };
};

//get inactive receptionist

exports.getinActiveReceptionists = async ({ user, query }) => {
  const allowedRoles = ["ADMIN"];
  if (!allowedRoles.includes(user.role)) {
    return {
      statusCode: 403,
      success: false,
      code: "FORBIDDEN",
      message: "You are not allowed to view Receptionists",
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

  const [total, receptionists] = await Promise.all([
    Receptionist.countDocuments(filter),

    Receptionist.find(filter)
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

  const filteredReceptionists = receptionists.filter((d) => d.user);
  return {
    statusCode: 200,
    success: true,
    code: "inActive ReceptionistS_FETCHED",
    message: " inActive Receptionists fetched successfully",
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: filteredReceptionists,
  };
};

//get all Receptionists
exports.getAllReceptionists = async ({ user, query }) => {
  const allowedRoles = ["ADMIN"];
  if (!allowedRoles.includes(user.role)) {
    return {
      statusCode: 403,
      success: false,
      code: "FORBIDDEN",
      message: "You are not allowed to view Receptionists",
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

  const [total, Receptionists] = await Promise.all([
   Receptionist.countDocuments(filter),

   Receptionist.find(filter)
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

  const filteredReceptionists = Receptionists.filter((d) => d.user);
  return {
    statusCode: 200,
    success: true,
    code: "Receptionists_FETCHED",
    message: "Receptionists fetched successfully",
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: filteredReceptionists,
  };
};

//admin can update receptionist password
exports.adminUpdatereceptionistsPassword = async ({ user, params, body }) => {
  if (user.role !== "ADMIN") {
    return {
      statusCode: 403,
      success: false,
      message: "Only Admin can update receptionist password",
    };
  }
  const { receptionistId } = params;
  const { newPassword } = body;

  
  const receptionist = await Receptionist.findById(receptionistId).populate("user");

  if ( !receptionist)
    return {
      statusCode: 404,
      success: false,
      message:  "receptionist not found",
    };

  const hashed = await bcrypt.hash(newPassword, 12);

  await User.findByIdAndUpdate( receptionist.user._id, { password: hashed });

  return {
    statusCode: 200,
    success: true,
    message: "Password updated successfully",
  };
};

//disable receptionist (we ar enot deleting receptionist for future use)
exports.disableReceptionist = async ({ user, params, body }) => {
  if (user.role !== "ADMIN") {
    return {
      statusCode: 403,
      success: false,
      code: "FORBIDDEN",
      message: "Only Admin can update receptionist status",
    };
  }

 const { receptionistId } = params;
  const { isActive } = body;

  const receptionist = await Receptionist.findById (receptionistId).populate("user");
  console.log(receptionist,"receptionist")

  if ( !receptionist) {
    return {
      statusCode: 404,
      success: false,
      code:  "RECEPTIONIST_NOT_FOUND",
      message:  "receptionist not found",
    };
  }
    await User.findByIdAndUpdate(
   receptionist.user._id,
    { isActive },
    { new: true, runValidators: true }
  );

  await User.findByIdAndUpdate(receptionist.user._id, { isActive });

  return {
    statusCode: 200,
    success: true,
    code:  "receptionist_STATUS_UPDATED",
    message:  `receptionist has been ${isActive ? "activated" : "inactive"} successfully`,
  };
};


// admmin(full access) AND RECEPTIONIST (limited update) can update Receptionist
exports.updateReceptionist = async ({ user, params, body }) => {
const { receptionistId } = params;

  const receptionist = await Receptionist.findById (receptionistId).populate("user");

  if (!receptionist)
    return {
      statusCode: 404,
      success: false,
      message: "Receptionist not found",
    };
  


  const isAdmin = user.role === "ADMIN";
  const isSelf = user.role === "RECEPTIONIST" ;
  

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
    email,
    password,
    experience,
    salary,
    shift,
    gender,
    aadhaar,
    address,
    deskNumber,
    shiftTiming,
    canEditPatient
  } = body;
  
 
  // Receptionist can edit limited fields
  if (isSelf) {
      // allowed fields for receptionist
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


    await Receptionist.findByIdAndUpdate(
      receptionistId,
      {
        experience,
        address,
    
      },
      { new: true, runValidators: true },
    );
    

    await User.findByIdAndUpdate(
      receptionist.user._id,
      {
        name,
        phone,
      },
      { runValidators: true },
    );
    

    const updated = await Receptionist.findById(receptionistId).populate("user").lean();

    return {
      statusCode: 200,
      success: true,
      message: "Profile updated",
      data: updated,
    };
  }

  // Admin can edit everything
  await Receptionist.findByIdAndUpdate(
    receptionistId,
    {
      email,
      experience,
      salary,
      shift,
      gender,
      aadhaar,
      address,
      deskNumber,
      shiftTiming,
      canEditPatient
    },
    { new: true, runValidators: true },
  );
  
  await User.findByIdAndUpdate(
    receptionist.user._id,
    {
      name,
      phone,
    },
    { runValidators: true },
  );
  
const updated = await Receptionist.findById(receptionistId).populate("user").lean();

  return {
    statusCode: 200,
    success: true,
    message: "Receptionist updated",
    data: updated,
  };
};

