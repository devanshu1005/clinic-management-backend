const bcrypt = require('bcryptjs')
const {User , Doctor} = require('../../Models')
const { generatePassword } = require('../../utils/otpServices')

// CREATE DOCTOR (ADMIN only)

exports. createDoctor = async (req, res, next) => {

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
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Email already registered",
      });
    }

    // Generate password
    const rawPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    // Create user 
    const user = await User.create({
            email,
            password: hashedPassword,
            name,
            phone,
            role: "DOCTOR",  
        });

        // Create doctor
        const doctor = await Doctor.create({
        user: user._id,
        Admin:req.user.id,
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
      return res.status(500).json({
        success: false,
        error: "Failed to create doctor",
      });
    }
    res.status(201).json({
      success: true,
      message: "Doctor created successfully",
      data: {
        ...doctor.toObject(),
        password: rawPassword, 
      },
    });
  } ;
//get doctor profile 
  exports.getDoctorProfile = async (req, res, next) => {
    
      const { doctorId } = req.params;
  
      const doctor = await Doctor.findBYId(doctorId)
      .populate('user')
      .lean();
  
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
    } ;

    //get all doctors(with pagination)
    exports.getAllDoctors = async (req, res, next) => {
  
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
    
         const filter = {
    Admin: req.user.role === "ADMIN" ? req.user.id : undefined
  }; 

const [total, doctors] = await Promise.all([
  Doctor.countDocuments(filter),

  Doctor.find(filter)
    .skip((page - 1) * limit)
    .limit(limit)
    .select('qualification experience department shift consultationFee availabilityDays')
    .populate({
      path: 'user',
      match: userFilter,
      select: 'name email phone isActive'
    })
    .sort({ createdAt: -1 })  
    .lean()
]);
    
  const filteredDoctors = doctors.filter(d => d.user);
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
          data: filteredDoctors,
        });
      };

      // admmin(full access) AND DOCTOR (limited update) can update doctor
  exports.updateDoctor = async (req, res, next) => {

    const { doctorId } = req.params;

 const doctor = await Doctor.findById(doctorId).populate('user');

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
    await Doctor.findByIdAndUpdate(
      doctorId,
      {
        experience,
        address,
        documentUrl,
      },
      { new: true, runValidators: true }
    );

    await User.findByIdAndUpdate(
      doctor.user._id,
      {
        name,
        phone,
      },
      { runValidators: true }
    );

    const updated = await Doctor.findById(doctorId)
      .populate('user')
      .lean();

    return res.json({
      success: true,
      message: "Profile updated",
      data: updated,
    });
  }


    // Admin can edit everything
    await Doctor.findByIdAndUpdate(
    doctorId,
    {
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
    { new: true, runValidators: true }
  );

  await User.findByIdAndUpdate(
    doctor.user._id,
    {
      name,
      phone,
    },
    { runValidators: true }
  );

  const updated = await Doctor.findById(doctorId)
    .populate('user')
    .lean();

  res.json({
    success: true,
    message: "Doctor updated",
    data: updated,
  });
};

  //admin can update doctor password
exports.adminUpdateDoctorPassword = async (req, res, next) => {
  
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Only Admin can update doctor password",
      });
    }

    const { doctorId } = req.params;
    const { newPassword } = req.body;




    const doctor = await Doctor.findById(doctorId).populate('user');

    if (!doctor)
      return res.status(404).json({ success: false, error: "Doctor not found" });

    const hashed = await bcrypt.hash(newPassword, 12);

    await User.findByIdAndUpdate(doctor.user._id, { password: hashed });

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } ;
//disable doctor (we ar enot deleting doctor for future use)
exports.disableDoctor = async (req, res, next) => {

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "Only Admin can update doctor status",
      });
    }

    const { doctorId } = req.params;
    const { isActive } = req.body;

 
 const doctor = await Doctor.findById(doctorId).populate('user');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        code: "DOCTOR_NOT_FOUND",
        message: "Doctor not found",
      });
    }

    
  await User.findByIdAndUpdate(doctor.user._id, { isActive });

    return res.status(200).json({
      success: true,
      code: "DOCTOR_STATUS_UPDATED",
      message: `Doctor has been ${isActive ? "activated" : "deactivated"} successfully`,
    });
  } ;
