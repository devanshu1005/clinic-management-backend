const prisma = require("../config/db");

// APPLY LEAVE (Employee or Admin)

exports.applyLeave = async (req, res, next) => {
  try {
    const {
      userId,        // required if admin is applying
      userRole,      // required if admin is applying
      leaveType,
      fromDate,
      toDate,
      isHalfDay,
      halfDayType,
      reason,
      isPaid,
      maxAllowed,
    } = req.body;
    console.log("DEBUG isPaid:", isPaid, typeof isPaid);
console.log("DEBUG maxAllowed:", maxAllowed, typeof maxAllowed);


    if (isPaid && (maxAllowed === null || maxAllowed === undefined)) {
      return res.status(400).json({
        success: false,
        error: "maxAllowed is required for paid leave",
      });
    }
    

    // Decide who the leave is for
    const targetUserId =
      req.user.role === "ADMIN" ? userId : req.user.id;

    const targetUserRole =
      req.user.role === "ADMIN" ? userRole : req.user.role;

    if (!targetUserId || !targetUserRole) {
      return res.status(400).json({
        success: false,
        error: "User information is required",
      });
    }

    // Date validation
    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (start > end) {
      return res.status(400).json({
        success: false,
        error: "From date cannot be greater than To date",
      });
    }

    // Calculate total days
    let totalDays = 0;

    if (isHalfDay) {
      totalDays = 0.5;
    } else {
      const diffTime = end.getTime() - start.getTime();
      totalDays = diffTime / (1000 * 60 * 60 * 24) + 1;
    }

    // Create leave
    const leave = await prisma.leave.create({
      data: {
        userId: targetUserId,
        userRole: targetUserRole,
        leaveType,
        fromDate: start,
        toDate: end,
        isHalfDay: isHalfDay || false,
        halfDayType: isHalfDay ? halfDayType : null,
        totalDays,
        reason,
        status: "PENDING",
        appliedBy: req.user.role,
        isPaid: isPaid ?? true,
        maxAllowed,
      },
    });

    res.status(201).json({
      success: true,
      message: "Leave applied successfully",
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};



// GET ALL LEAVES (Admin)

exports.getAllLeaves = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Only Admin can view all leaves",
      });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const {
      status,
      userRole,
      fromDate,
      toDate,
    } = req.query;

    const where = {};

    if (status) where.status = status;
    if (userRole) where.userRole = userRole;

    if (fromDate && toDate) {
      where.fromDate = { gte: new Date(fromDate) };
      where.toDate = { lte: new Date(toDate) };
    }

    const leaves = await prisma.leave.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      page,
      limit,
      data: leaves,
    });
  } catch (error) {
    next(error);
  }
};



// GET MY LEAVES (Employee)

exports.getMyLeaves = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status } = req.query;

    const where = {
      userId: req.user.id,
    };

    if (status) where.status = status;

    const leaves = await prisma.leave.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      page,
      limit,
      data: leaves,
    });
  } catch (error) {
    next(error);
  }
};



// APPROVE LEAVE (Admin)

exports.approveLeave = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Only Admin can approve leave",
      });
    }

    const { leaveId } = req.params;

    const leave = await prisma.leave.findUnique({
      where: { id: leaveId },
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        error: "Leave not found",
      });
    }

    if (leave.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        error: "Leave is already processed",
      });
    }

    const updated = await prisma.leave.update({
      where: { id: leaveId },
      data: {
        status: "APPROVED",
        approvedBy: req.user.id,
      },
    });

    res.json({
      success: true,
      message: "Leave approved successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};



// REJECT LEAVE (Admin)

exports.rejectLeave = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Only Admin can reject leave",
      });
    }

    const { leaveId } = req.params;

    const leave = await prisma.leave.findUnique({
      where: { id: leaveId },
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        error: "Leave not found",
      });
    }

    if (leave.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        error: "Leave is already processed",
      });
    }

    const updated = await prisma.leave.update({
      where: { id: leaveId },
      data: {
        status: "REJECTED",
        approvedBy: req.user.id,
      },
    });

    res.json({
      success: true,
      message: "Leave rejected successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
// GET LEAVE BALANCE (Employee)
exports.getLeaveBalance = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get approved + paid leaves
    const leaves = await prisma.leave.findMany({
      where: {
        userId,
        userRole,
        status: "APPROVED",
        isPaid: true,
      },
      select: {
        totalDays: true,
        maxAllowed: true,
      },
    });

    let usedLeaves = 0;
    let totalAllowed = null;

    leaves.forEach(leave => {
      usedLeaves += leave.totalDays;
      if (leave.maxAllowed !== null) {
        totalAllowed = leave.maxAllowed;
      }
    });

    res.json({
      success: true,
      data: {
        totalAllowed,
        usedLeaves,
        remainingLeaves:
          totalAllowed !== null ? totalAllowed - usedLeaves : null,
      },
    });
  } catch (error) {
    next(error);
  }
};
// GET LEAVE HISTORY BY EMPLOYEE (Admin)
exports.getEmployeeLeaveHistory = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Only Admin can view employee leave history",
      });
    }

    const { userId } = req.params;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const leaves = await prisma.leave.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      page,
      limit,
      data: leaves,
    });
  } catch (error) {
    next(error);
  }
};
