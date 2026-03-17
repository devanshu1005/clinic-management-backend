const { User,Doctor, Staff, Receptionist, Salary, Leave  } = require("../../models");



 exports.getSuperAdminDashboard = async ({ user }) => {

   if (user.role !== "SUPER_ADMIN") {
     return {
       statusCode: 403,
       success: false,
       message: "Access denied. Super Admin only."
     };
   }

   const now = new Date();
   const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

   const [
     totalAdmins,
     activeAdmins,
     inactiveAdmins,
     expiredSubscriptions,
     expiringSoon
   ] = await Promise.all([

      //Total admins
     User.countDocuments({
       role: "ADMIN"
     }),

     // Active admins
     User.countDocuments({
       role: "ADMIN",
       isActive: true
     }),

      //Inactive admins
     User.countDocuments({
       role: "ADMIN",
       isActive: false
     }),

      //Expired subscriptions
     User.countDocuments({
       role: "ADMIN",
       subsValidity: { $lt: now }
     }),

    //  Expiring within 1 week
     User.countDocuments({
       role: "ADMIN",
       subsValidity: {
         $gte: now,
         $lte: oneWeekFromNow
       }
     })

   ]);

   const adminsExpiringSoon = await User.find({
     role: "ADMIN",
     subsValidity: {
       $gte: now,
       $lte: oneWeekFromNow
     }
   })
     .select("name email clinicName location subsValidity isActive")
     .sort({ subsValidity: 1 });

   const expiredAdmins = await User.find({
     role: "ADMIN",
     subsValidity: { $lt: now }
   })
     .select("name email clinicName location subsValidity isActive")
     .sort({ subsValidity: -1 })
     .limit(10);

   return {
     success: true,
     data: {
       totalAdmins,
       activeAdmins,
       inactiveAdmins,
       expiredSubscriptions,
       expiringSoon
     }
   };
 };


exports.getAdminDashboard = async ({ user }) => {

  if (user.role !== "ADMIN") {
    return {
      statusCode: 403,
      success: false,
      message: "Access denied. Admin only."
    };
  }

  const adminId = user._id;

  const admin = await User.findById(adminId)
    .select("name email clinicName location subsValidity isActive createdAt");

  if (!admin) {
    return {
      statusCode: 404,
      success: false,
      message: "Admin not found"
    };
  }

  const now = new Date();

  const daysRemaining = admin.subsValidity
    ? Math.ceil((admin.subsValidity - now) / (1000 * 60 * 60 * 24))
    : null;

  const subscriptionStatus = !admin.subsValidity
    ? "NO_SUBSCRIPTION"
    : daysRemaining < 0
    ? "EXPIRED"
    : daysRemaining <= 7
    ? "EXPIRING_SOON"
    : "ACTIVE";


const [
  totalDoctors,
  totalReceptionists,
  totalStaff,
  
  activeEmployees
] = await Promise.all([
  Doctor.countDocuments({ admin: adminId }),
Receptionist.countDocuments({ admin: adminId }),
Staff.countDocuments({ admin: adminId }),

User.countDocuments({
  admin: adminId,
  role: { $in: ["DOCTOR", "RECEPTIONIST", "STAFF"] },
  isActive: true
})
]);


const  payrollData = await Salary.aggregate([
  { $match: { admin: adminId } },
  { $group: { _id: null, total: { $sum: "$amount" } } }
]);

const totalPayroll = payrollData[0]?.total || 0;



  return {
    success: true,
    data: {
      clinic: {
        ...admin.toObject(),
        subscriptionStatus,
        daysRemaining
      },
    employees: {
    totalDoctors,
    totalReceptionists,
    totalStaff,
    totalEmployees: totalDoctors + totalReceptionists + totalStaff,
     activeEmployees

  },

  finance: {
     payrollData
  }
}
      
    
  };
};


//DOCTOR DASHBOARD


exports.getDoctorDashboard = async ({ user }) => {

  if (user.role !== "DOCTOR") {
    return {
      statusCode: 403,
      success: false,
      message: "Access denied. Doctor only."
    };
  }

  const doctorId = user._id;

  const doctor = await Doctor.findOne({ user: doctorId })
    .select("specialization experience admin name phone qualification registrationNo salary shift gender department aadhaar address  consultationFee availabilityDays ");

  if (!doctor) {
    return {
      statusCode: 404,
      success: false,
      message: "Doctor profile not found"
    };
  }




  const [
    leaves,
    salaryAdjustments
  ] = await Promise.all([


    Leave.find({
      user: doctorId,
    }),

    Salary.find({
      userId: doctorId,
      userRole: "DOCTOR"
    })
  ]);

  // Leave summary
  let usedLeaves = 0;
  let rejectedLeaves = 0;
  let totalAllowed = null;

leaves.forEach(leave => {

  if (leave.status === "APPROVED") {
    usedLeaves += leave.totalDays;
  }

  if (leave.status === "REJECTED") {
    rejectedLeaves += 1;
  }

  if (leave.maxAllowed !== null) {
    totalAllowed = leave.maxAllowed;
  }

});

  const remainingLeaves =
    totalAllowed !== null ? totalAllowed - usedLeaves : null;

   //Salary summary
  let bonus = 0;
  let penalty = 0;

  salaryAdjustments.forEach(a => {
    if (a.type === "BONUS") bonus += a.amount;
    if (a.type === "PENALTY") penalty += a.amount;
  });

  return {
    success: true,
    data: {

      doctorProfile: {
        specialization: doctor.specialization,
        experience: doctor.experience,
        admin: doctor.admin,
        name: doctor.name,
        phone: doctor.phone,
        qualification: doctor.qualification,
        registrationNo: doctor.registrationNo,
        salary: doctor.salary,
        shift: doctor.shift,
        gender: doctor.gender,
        department: doctor.department,
        aadhaar: doctor.aadhaar,
        address: doctor.address,
        consultationFee: doctor.consultationFee,
        availabilityDays: doctor.availabilityDays
      },

   

      leave: {
        totalAllowed,
        usedLeaves,
        rejectedLeaves,
        remainingLeaves
      },

      salary: {
        bonus,
        penalty
      }

    }
  };
};


//RECEPTIONIST DASHBOARD


exports.getReceptionistDashboard = async ({ user }) => {

  if (user.role !== "RECEPTIONIST") {
    return {
      statusCode: 403,
      success: false,
      message: "Access denied. Receptionist only."
    };
  }
   const receptionistId = user._id;

const receptionist = await Receptionist.findOne({user: receptionistId})
.select("name phone admin deskNo gender aadhaar address shiftTiming canEditPatients");

if(!receptionist){
  return{
    sourceCode: 404,
    success: false,
    message: "Receptionist profile not found"
  };
}
 

  const [
    leaves,
    salaryAdjustments
  ] = await Promise.all([


    Leave.find({
      user: receptionistId,
    }),

    Salary.find({
      userId: receptionistId,
      userRole: "RECEPTIONIST"
    })
  ]);

   //Leave summary
  let usedLeaves = 0;
  let rejectedLeaves = 0;
  let totalAllowed = null;

leaves.forEach(leave => {

  if (leave.status === "APPROVED") {
    usedLeaves += leave.totalDays;
  }

  if (leave.status === "REJECTED") {
    rejectedLeaves += 1;
  }

  if (leave.maxAllowed !== null) {
    totalAllowed = leave.maxAllowed;
  }

});

  const remainingLeaves =
    totalAllowed !== null ? totalAllowed - usedLeaves : null;

   //Salary summary
  let bonus = 0;
  let penalty = 0;

  salaryAdjustments.forEach(a => {
    if (a.type === "BONUS") bonus += a.amount;
    if (a.type === "PENALTY") penalty += a.amount;
  });

  return {
    success: true,
    data: {

      receptionistProfile: {
        name: receptionist.name,
        phone: receptionist.phone,
        admin: receptionist.admin,
        deskNo: receptionist.deskNo,
        gender: receptionist.gender,
        aadhaar: receptionist.aadhaar,
        address: receptionist.address,
        shiftTiming: receptionist.shiftTiming,
        canEditPatients: receptionist.canEditPatients
      },},

  
  
      leave: {
        totalAllowed,
        usedLeaves,
        rejectedLeaves,
        remainingLeaves
      },

      salary: {
        bonus,
        penalty
      }

    }

};


//STAFF DASHBOARD

exports.getStaffDashboard = async ({ user }) => {

  if (user.role !== "STAFF") {
    return {
      statusCode: 403,
      success: false,
      message: "Access denied. Staff only."
    };
  }
   const staffId = user._id;

const staff = await Staff.findOne({user: staffId})
.select("name phone admin skill category experience salary shift gender aadhaar address shiftTiming ");

if(!staff){
  return{
    sourceCode: 404,
    success: false,
    message: "Staff profile not found"
  };
}


  const [
    leaves,
    salaryAdjustments
  ] = await Promise.all([

    Leave.find({
      user: staffId,
    }),

    Salary.find({
      userId: staffId,
      userRole: "STAFF"
    })
  ]);

   //Leave summary
  let usedLeaves = 0;
  let rejectedLeaves = 0;
  let totalAllowed = null;

leaves.forEach(leave => {

  if (leave.status === "APPROVED") {
    usedLeaves += leave.totalDays;
  }

  if (leave.status === "REJECTED") {
    rejectedLeaves += 1;  
  }

  if (leave.maxAllowed !== null) {
    totalAllowed = leave.maxAllowed;
  }

});

  const remainingLeaves =
    totalAllowed !== null ? totalAllowed - usedLeaves : null;

  // Salary summary
  let bonus = 0;
  let penalty = 0;

  salaryAdjustments.forEach(a => {
    if (a.type === "BONUS") bonus += a.amount;
    if (a.type === "PENALTY") penalty += a.amount;
  });

  return {
    success: true,
    data: {

      staffProfile: {
        name: staff.name,
        phone: staff.phone,
        admin: staff.admin,
        skill: staff.skill,
        category: staff.category,
        experience: staff.experience,
        salary: staff.salary,
        shift: staff.shift,
        gender: staff.gender,
        aadhaar: staff.aadhaar,
        address: staff.address,
        shiftTiming: staff.shiftTiming
      },},

      leave: {
        totalAllowed,
        usedLeaves,
        rejectedLeaves,
        remainingLeaves
      },

      salary: {
        bonus,
        penalty
      }
      }
    }





