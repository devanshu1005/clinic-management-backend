const prisma = require("../config/db");
const PDFDocument = require("pdfkit");

// ===================================================
// ADD SALARY ENTRY (BONUS / PENALTY / REVISION)
// ADMIN only
// ===================================================
exports.addSalaryEntry = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Only Admin can manage salary",
      });
    }

    const { userId, userRole, type, amount, reason, month, year } = req.body;
    if (!["BONUS", "PENALTY", "REVISION"].includes(type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid salary type",
      });
    }
    
    if (!userId || !userRole || !type || !amount || !month || !year) {
      return res.status(400).json({
        success: false,
        error: "Required fields are missing",
      });
    }

    if (!["STAFF", "RECEPTIONIST", "DOCTOR"].includes(userRole)) {
      return res.status(400).json({
        success: false,
        error: "Salary allowed only for Staff, Receptionist, or Doctor",
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: "Amount must be greater than zero",
      });
    }

    if (Number(month) < 1 || Number(month) > 12) {
      return res.status(400).json({
        success: false,
        error: "Month must be between 1 and 12",
      });
    }

    const entry = await prisma.salary.create({
      data: {
        userId,
        userRole,
        type,
        amount: Number(amount),
        reason,
        month: Number(month),
        year: Number(year),
      },
    });

    res.status(201).json({
      success: true,
      message: "Salary entry added successfully",
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

// ===================================================
// UPDATE BASE SALARY (REVISION)
// ADMIN only
// ===================================================
exports.updateBaseSalary = async (req, res, next) => {
  try {
   
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Only Admin can update salary",
      });
    }

    const { userId, userRole, newSalary, reason, month, year } = req.body;
    if (!["STAFF", "RECEPTIONIST", "DOCTOR"].includes(userRole)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user role for salary update",
      });
    }
    
    if (!userId || !userRole || !newSalary || !month || !year) {
      return res.status(400).json({
        success: false,
        error: "Required fields are missing",
      });
    }

    if (userRole === "STAFF") {
      await prisma.staff.update({
        where: { userId },
        data: { salary: Number(newSalary) },
      });
    }

    if (userRole === "RECEPTIONIST") {
      await prisma.receptionist.update({
        where: { userId },
        data: { salary: Number(newSalary) },
      });
    }

    if (userRole === "DOCTOR") {
      await prisma.doctor.update({
        where: { userId },
        data: { salary: Number(newSalary) },
      });
    }

    await prisma.salary.create({
      data: {
        userId,
        userRole,
        type: "REVISION",
        amount: Number(newSalary),
        reason: reason || "Salary revised",
        month: Number(month),
        year: Number(year),
      },
    });

    res.json({
      success: true,
      message: "Salary updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ===================================================
// GET SALARY HISTORY (BONUS / PENALTY / REVISION)
// ===================================================
exports.getSalaryHistory = async (req, res, next) => {
  try {
    const { userId, userRole } = req.params;

    const history = await prisma.salary.findMany({
      where: { userId, userRole },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

// ===================================================
// GET SALARY DETAILS (MONTHLY / YEARLY)
// ===================================================
exports.getEmployeeSalaryDetails = async (req, res, next) => {
  try {
    const { userId, userRole, month, year } = req.query;

    if (!userId || !userRole || !year) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters",
      });
    }

    let baseSalary = 0;

    if (userRole === "STAFF") {
      const staff = await prisma.staff.findUnique({
        where: { userId },
        select: { salary: true },
      });
      baseSalary = staff?.salary || 0;
    }

    if (userRole === "RECEPTIONIST") {
      const receptionist = await prisma.receptionist.findUnique({
        where: { userId },
        select: { salary: true },
      });
      baseSalary = receptionist?.salary || 0;
    }

    if (userRole === "DOCTOR") {
      const doctor = await prisma.doctor.findUnique({
        where: { userId },
        select: { salary: true },
      });
      baseSalary = doctor?.salary || 0;
    }

    const adjustments = await prisma.salary.findMany({
      where: {
        userId,
        userRole,
        year: Number(year),
        ...(month && { month: Number(month) }),
      },
    });

    let bonus = 0;
    let penalty = 0;

    adjustments.forEach(a => {
      if (a.type === "BONUS") bonus += a.amount;
      if (a.type === "PENALTY") penalty += a.amount;
    });

    res.json({
      success: true,
      data: {
        baseSalary,
        bonus,
        penalty,
        netSalary: baseSalary + bonus - penalty,
        adjustments,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ===================================================
// DOWNLOAD PAYSLIP (PDF)
// ===================================================
exports.downloadPayslip = async (req, res, next) => {
  try {
    const { userId, userRole, month, year } = req.query;

    const adjustments = await prisma.salary.findMany({
      where: {
        userId,
        userRole,
        month: Number(month),
        year: Number(year),
      },
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
  } catch (error) {
    next(error);
  }
};
