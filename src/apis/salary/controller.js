const mongoose = require("mongoose");
const {  Staff, Receptionist, Doctor, Salary } = require("../../models");
const PDFDocument = require("pdfkit");

// ADD SALARY ENTRY (BONUS / PENALTY / REVISION)
// ADMIN only

exports.addSalaryEntry = async ({user,body}) =>{
    
    if(user.role !== "ADMIN"){
        return{
            statusCode: 403,
            success: false,
            code: "FORBIDDEN",
            message: "Only Admin can manage salary",
        }
    }

    const { userId, userRole, type, amount, reason, month, year } = body;
    // if (!["BONUS", "PENALTY", "REVISION"].includes(type)) {
    //  return{
    //     statusCode: 400,
    //     success: false,
    //     message: "Invalid salary type",
    //  }
    // }
    
    // if (!userId || !userRole || !type || !amount || !month || !year) {
    //  return{
    //     statusCode: 400,
    //     success: false,
    //     message: "Required fields are missing",
    //  }
    // }

    // if (!["STAFF", "RECEPTIONIST", "DOCTOR"].includes(userRole)) {
    //  return{
    //     statusCode: 400,
    //     success: false,
    //     message: "Invalid user role for salary update",
    //  }
    // }

    // if(Number(amount) < 0){
    //     return{
    //         statusCode: 400,
    //         success: false,
    //         message: "Amount cannot be negative",
    //      }
    // }

    // if(Number(month)<1 || Number(month)>12){
    //     return{
    //         statusCode: 400,
    //         success: false,
    //         message: "Invalid month",
    //      }
    // }

  const entry = await Salary.create({
      user: userId,        // employee receiving salary
  admin: user._id,     // admin performing the action
    userId,
    userRole,
    type,
    amount: Number(amount),
    reason,
    month: Number(month),
    year: Number(year),
  });

  return{
    statusCode: 200,
    success: true,
    message: "Salary entry added successfully",
    data: entry,
  };

 
}


//UPDATE BASE SALARY (REVISION)
// ADMIN only
exports.updateBaseSalary = async ({ user, body }) => {

  if (user.role !== "ADMIN") {
    return {
      statusCode: 403,
      success: false,
      error: "Only Admin can update salary",
    };
  }

  const { userId, userRole, newSalary, reason, month, year } = body;

  if (userRole === "STAFF") {
    await Staff.updateOne(
      { userId },
      { $set: { salary: Number(newSalary) } }
    );
  }

  if (userRole === "RECEPTIONIST") {
    await Receptionist.updateOne(
      { userId },
      { $set: { salary: Number(newSalary) } }
    );
  }

  if (userRole === "DOCTOR") {
    await Doctor.updateOne(
      { userId },
      { $set: { salary: Number(newSalary) } }
    );
  }

  await Salary.create({
    user: userId,
    admin: user._id,
    userRole,
    type: "REVISION",
    amount: Number(newSalary),
    reason: reason || "Salary revised",
    month: Number(month),
    year: Number(year),
  });

  return {
    statusCode: 200,
    success: true,
    message: "Salary updated successfully",
  };
};

// GET SALARY HISTORY (BONUS / PENALTY / REVISION)

exports.getSalaryHistory = async ({ params }) => {

  const { userId, userRole } = params;

  const history = await Salary.find({
    user: userId,
    userRole,
  }).sort({ createdAt: -1 });

  return {
    statusCode: 200,
    success: true,
    count: history.length,
    data: history,
  };
};

// GET SALARY DETAILS (MONTHLY / YEARLY)

exports.getEmployeeSalaryDetails = async ({ query }) => {

  const { userId, userRole, month, year } = query;

  let baseSalary = 0;

  if (userRole === "STAFF") {
    const staff = await Staff.findOne(
      { userId },
      { salary: 1 }
    );
    baseSalary = staff?.salary || 0;
  }

  if (userRole === "RECEPTIONIST") {
    const receptionist = await Receptionist.findOne(
      { userId },
      { salary: 1 }
    );
    baseSalary = receptionist?.salary || 0;
  }

  if (userRole === "DOCTOR") {
    const doctor = await Doctor.findOne(
      { userId },
      { salary: 1 }
    );
    baseSalary = doctor?.salary || 0;
  }

  const adjustments = await Salary.find({
    user: userId,
    userRole,
    year: Number(year),
    ...(month && { month: Number(month) }),
  });

  let bonus = 0;
  let penalty = 0;

  adjustments.forEach(a => {
    if (a.type === "BONUS") bonus += a.amount;
    if (a.type === "PENALTY") penalty += a.amount;
  });

  return {
    statusCode: 200,
    success: true,
    data: {
      baseSalary,
      bonus,
      penalty,
      netSalary: baseSalary + bonus - penalty,
      adjustments,
    },
  };
};


// Payslip download

exports.downloadPayslip = async (req, res) => {

  const { userId, userRole, month, year } = req.query;

  const adjustments = await Salary.find({
    user: userId,
    userRole,
    month: Number(month),
    year: Number(year),
  });

  const doc = new PDFDocument();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=payslip-${month}-${year}.pdf`
  );

  doc.pipe(res);

  doc.fontSize(18).text("Salary Payslip", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`Role: ${userRole}`);
  doc.text(`Month / Year: ${month} / ${year}`);
  doc.moveDown();

  adjustments.forEach(a => {
    doc.text(`${a.type}: ${a.amount} (${a.reason || "-"})`);
  });

  doc.end();
};