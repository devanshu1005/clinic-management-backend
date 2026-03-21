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


//GET SALARY OF ALL EMPLOYEE RECEPTIONIST, STAFF , DOCTOR ONLY ADMIN CAN ACCESS

exports.getSalaryDashboardList = async ({ user, query }) => {

  if (user.role !== "ADMIN") {
    return {
      statusCode: 403,
      success: false,
      error: "Only Admin can access salary dashboard",
    };
  }

  const {
    userRole,
    month,
    year,
    page = 1,
    limit = 10,
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  let employees = [];
  let totalCount = 0;

  //  STAFF 
  if (userRole === "STAFF") {
    totalCount = await Staff.countDocuments({ admin: user._id });

    const staff = await Staff.find({ admin: user._id })
      .skip(skip)
      .limit(Number(limit))
      .populate("user", "name isActive");

    employees = staff.map(s => ({
      userId: s.userId,
      name: s.user?.name,
      role: "STAFF",
      baseSalary: s.salary,
      isActive: s.user?.isActive,
    }));
  }

  //  RECEPTIONIST 
  if (userRole === "RECEPTIONIST") {
    totalCount = await Receptionist.countDocuments({ admin: user._id });

    const receptionists = await Receptionist.find({ admin: user._id })
      .skip(skip)
      .limit(Number(limit))
      .populate("user", "name isActive");

    employees = receptionists.map(r => ({
      userId: r.userId,
      name: r.user?.name,
      role: "RECEPTIONIST",
      baseSalary: r.salary,
      isActive: r.user?.isActive,
    }));
  }

  //  DOCTOR 
  if (userRole === "DOCTOR") {
    totalCount = await Doctor.countDocuments({ admin: user._id });

    const doctors = await Doctor.find({ admin: user._id })
      .skip(skip)
      .limit(Number(limit))
      .populate("user", "name isActive");

    employees = doctors.map(d => ({
      userId: d.userId,
      name: d.user?.name,
      role: "DOCTOR",
      baseSalary: d.salary,
      isActive: d.user?.isActive,
    }));
  }

  //  ALL 
  if (userRole === "ALL") {
    const [staffCount, receptionistCount, doctorCount] = await Promise.all([
      Staff.countDocuments({ admin: user._id }),
      Receptionist.countDocuments({ admin: user._id }),
      Doctor.countDocuments({ admin: user._id }),
    ]);

    totalCount = staffCount + receptionistCount + doctorCount;

    const [staff, receptionists, doctors] = await Promise.all([
      Staff.find({ admin: user._id })
        .skip(skip)
        .limit(Number(limit))
        .populate("user", "name isActive"),

      Receptionist.find({ admin: user._id })
        .skip(skip)
        .limit(Number(limit))
        .populate("user", "name isActive"),

      Doctor.find({ admin: user._id })
        .skip(skip)
        .limit(Number(limit))
        .populate("user", "name isActive"),
    ]);

    employees = [
      ...staff.map(s => ({
        userId: s.userId,
        name: s.user?.name,
        role: "STAFF",
        baseSalary: s.salary,
        isActive: s.user?.isActive,
      })),
      ...receptionists.map(r => ({
        userId: r.userId,
        name: r.user?.name,
        role: "RECEPTIONIST",
        baseSalary: r.salary,
        isActive: r.user?.isActive,
      })),
      ...doctors.map(d => ({
        userId: d.userId,
        name: d.user?.name,
        role: "DOCTOR",
        baseSalary: d.salary,
        isActive: d.user?.isActive,
      })),
    ];
  }

  //  SALARY ADJUSTMENTS 
  const data = await Promise.all(
    employees.map(async emp => {

      const adjustments = await Salary.find({
        admin: user._id, 
        user: emp.userId,
        userRole: emp.role,
        ...(month && { month: Number(month) }),
        ...(year && { year: Number(year) }),
      });

      let bonus = 0;
      let penalty = 0;

      adjustments.forEach(a => {
        if (a.type === "BONUS") bonus += a.amount;
        if (a.type === "PENALTY") penalty += a.amount;
      });

      return {
        ...emp,
        bonus,
        penalty,
        adjustments,
        netSalary: emp.baseSalary + bonus - penalty,
      };
    })
  );

  return {
    statusCode: 200,
    success: true,
    data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: totalCount,
      totalPages: Math.ceil(totalCount / Number(limit)),
    },
  };
};


// according to this API how much money is the clinic spending on salaries this month
exports.getSalaryDashboardSummary = async ({ user, query }) => {

  if (user.role !== "ADMIN") {
    return {
      statusCode: 403,
      success: false,
      error: "Only Admin can access salary dashboard",
    };
  }

  const { userRole, month, year } = query;

  let salaryFilter = {
    admin: user._id,
    userRole,
  };

  if (year) salaryFilter.year = Number(year);
  if (month) salaryFilter.month = Number(month);

  const salaryRecords = await Salary.find(salaryFilter);

  let totalBonus = 0;
  let totalPenalty = 0;

  salaryRecords.forEach(s => {
    if (s.type === "BONUS") totalBonus += s.amount;
    if (s.type === "PENALTY") totalPenalty += s.amount;
  });

  //  BASE SALARY 
  let baseSalaries = [];

  if (userRole === "STAFF") {
    baseSalaries = await Staff.find(
      { admin: user._id },
      { salary: 1 }
    );
  }

  if (userRole === "RECEPTIONIST") {
    baseSalaries = await Receptionist.find(
      { admin: user._id },
      { salary: 1 }
    );
  }

  if (userRole === "DOCTOR") {
    baseSalaries = await Doctor.find(
      { admin: user._id },
      { salary: 1 }
    );
  }

  const totalBaseSalary = baseSalaries.reduce(
    (sum, s) => sum + s.salary,
    0
  );

  const employeeCount = baseSalaries.length;

  
  let totalSalary = 0;
  let averageSalary = 0;

  // MONTHLY
  if (month && year) {
    totalSalary = totalBaseSalary + totalBonus - totalPenalty;

    averageSalary =
      employeeCount > 0
        ? Math.round(totalSalary / employeeCount)
        : 0;
  }

  // YEARLY
  else if (year && !month) {
    const yearlyBase = totalBaseSalary * 12;

    totalSalary = yearlyBase + totalBonus - totalPenalty;

    averageSalary =
      employeeCount > 0
        ? Math.round(totalSalary / employeeCount)
        : 0;
  }


  else {
    totalSalary = totalBaseSalary + totalBonus - totalPenalty;

    averageSalary =
      employeeCount > 0
        ? Math.round(totalSalary / employeeCount)
        : 0;
  }

  return {
    statusCode: 200,
    success: true,
    data: {
      totalSalary,
      averageSalary,
      totalBonus,
      totalPenalty,
      pendingAdjustment: totalBonus - totalPenalty,
      type: month ? "MONTHLY" : year ? "YEARLY" : "ALL",
    },
  };
};

//LEAVE SUMMERY

exports.getLeaveDashboardSummary = async ({ user }) => {

  if (user.role !== "ADMIN") {
    return {
      statusCode: 403,
      success: false,
      error: "Only Admin can access leave dashboard",
    };
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const next7Days = new Date();
  next7Days.setDate(todayStart.getDate() + 7);

  const[
    totalLeaves,
    pendingLeaves,
    approvedToday,
    onLeaveToday,
    upcomingLeaves
  ]= await Promise.all([
   Leave.countDocuments(),
   Leave.countDocuments({status:"PENDING"}),

   Leave.countDocuments({status:"APPROVED",fromDate:{$gte:todayStart,$lte:todayEnd}}),

   Leave.countDocuments({status:"ON_LEAVE",fromDate:{$gte:todayStart,$lte:todayEnd}}),

   Leave.countDocuments({status:"APPROVED",fromDate:{$gte:next7Days}})
  ])

 return({
    statusCode: 200,
    success: true,
    data: {
      totalLeaves,
      pendingLeaves,
      approvedToday,
      onLeaveToday,
      upcomingLeaves
    },
  });
}

//EMPLOYEES ON LEAVE TODAY

exports.getEmployeesOnLeaveToday = async ({ user }) => {

  if(user.role!=="ADMIN"){
    return {
      statusCode: 403,
      success: false,
      error: "Only Admin can access this data",
    };
  }

  const today = new Date();

  const leaves = await Leave.find({status:"APPROVED",fromDate:{$lte:today},toDate:{$gte:today}})

  .sort({fromDate:-1})

   if (!leaves || leaves.length === 0) {
    return {
      statusCode: 200,
      success: true,
      message: "No employees are on leave today",
      data: Leave,
    };
  }

  return {
    statusCode: 200,
    success: true,
    data: Leave,
  };
}

//UPCOMING LEAVES (NEXT 7 DAYS)

exports.getUpcomingLeaves = async ({ user }) => {

  if(user.role!=="ADMIN"){
    return {
      statusCode: 403,
      success: false,
      error: "Only Admin can access upcoming leaves",
    }



  }
    const today = new Date();
    const next7Days = new Date();
    next7Days.setDate(today.getDate()+7);

    const leaves = await Leave.find({status:"APPROVED",fromDate:{$gte:today,$lte:next7Days}})

    .sort({fromDate:-1})
       if (!leaves || leaves.length === 0) {
    return {
      statusCode: 200,
      success: true,
      message: "No upcoming leave",
      data: Leave,
    };
  }

    return {
      statusCode: 200,
      success: true,
      data: Leave,
    };
  
  
  
  }


  //PENDING LEAVES

  exports.getPendingLeavesDashboard = async ({ user }) => {

    if(user.role!=="ADMIN"){
      return {
        statusCode: 403,
        success: false,
        error: "Only Admin can access pending leaves",
      }
    }

    const leaves = await Leave.find({status:"PENDING"})

    .sort({createdAt:-1})



    return {
      statusCode: 200,
      success: true,
      data: leaves,
    };
  }