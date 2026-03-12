const mongoose = require("mongoose");
const {  Staff, Receptionist, Doctor,Leave} = require("../../models");
//const leave = require("../models/leave");



exports.applyLeave = async ({ user, body }) => {
  const {
    userId,
    adminId,
    userRole,
    leaveType,
    fromDate,
    toDate,
    isHalfDay,
    halfDayType,
    reason,
    isPaid,
    maxAllowed,
  } = body;

  if (isPaid && (maxAllowed === null || maxAllowed === undefined)) {
    return {
      statusCode: 400,
      success: false,
      message: "maxAllowed is required for paid leave",
    };
  }

  // Decide who the leave is for and create leave
  const targetUserId = user.role === "ADMIN" ? userId : user._id;
  const targetUserRole = user.role === "ADMIN" ? userRole : user.role;

  if (!targetUserId || !targetUserRole) {
    return {
      statusCode: 400,
      success: false,
      message: "User information is required",
    };
  }

  const start = new Date(fromDate);
  const end = new Date(toDate);

  if (start > end) {
    return {
      statusCode: 400,
      success: false,
      message: "From date cannot be greater than To date",
    };
  }

  let totalDays = 0;

  if (isHalfDay) {
    totalDays = 0.5;
  } else {
    const diffTime = end.getTime() - start.getTime();
    totalDays = diffTime / (1000 * 60 * 60 * 24) + 1;
  }

  const leave = await Leave.create({
    user: targetUserId,
    userRole: targetUserRole,
    admin: user.role === "ADMIN" ? user._id : adminId,
    leaveType,
    fromDate: start,
    toDate: end,
    isHalfDay: isHalfDay || false,
    halfDayType: isHalfDay ? halfDayType : null,
    totalDays,
    reason,
    status: "PENDING",
    appliedBy: user.role,
    isPaid: isPaid ?? true,
    maxAllowed,
  });

  return {
    statusCode: 201,
    success: true,
    message: "Leave applied successfully",
    data: leave,
  };
};

//GET ALL LEAVES ADMIN ONLY

exports.getAllLeaves = async ({ user, query }) => {

  if (user.role !== "ADMIN") {
    return {
      statusCode: 403,
      success: false,
      message: "Only Admin can view all leaves",
    };
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const { status, userRole, fromDate, toDate } = query;

  const filter = {};

  if (status) filter.status = status;  //here status means PENDING,APPROVED,REJECTED
  if (userRole) filter.userRole = userRole;

  if (fromDate && toDate) {
    filter.fromDate = { $gte: new Date(fromDate) };
    filter.toDate = { $lte: new Date(toDate) };
  }

  const leaves = await Leave.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    success: true,
    page,
    limit,
    data: leaves,
  };
};

//get my leaves


exports.getMyLeaves = async ({ user, query }) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const { status } = query;

  const filter = {
    user: user._id
  };

  if (status) filter.status = status;

  const leaves = await Leave.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    success: true,
    page,
    limit,
    data: leaves,
  };
};

//only admin can approve leave


exports.approveLeave = async ({ user, params }) => {

  if (user.role !== "ADMIN") {
    return {
      statusCode: 403,
      success: false,
      message: "Only Admin can approve leave",
    };
  }

  const { leaveId } = params;

  const leave = await Leave.findById(leaveId);

  if (!leave) {
    return {
      statusCode: 404,
      success: false,
      message: "Leave not found",
    };
  }

  if (leave.status !== "PENDING") {
    return {
      statusCode: 400,
      success: false,
      message: "Leave is already processed",
    };
  }

  leave.status = "APPROVED";
  leave.approvedBy = user._id;

  await leave.save();

  return {
    success: true,
    message: "Leave approved successfully",
    data: leave,
  };
};

//reject leave by admin



exports.rejectLeave = async ({ user, params }) => {

  if (user.role !== "ADMIN") {
    return {
      statusCode: 403,
      success: false,
      message: "Only Admin can reject leave",
    };
  }

  const { leaveId } = params;

  const leave = await Leave.findById(leaveId);

  if (!leave) {
    return {
      statusCode: 404,
      success: false,
      message: "Leave not found",
    };
  }

  if (leave.status !== "PENDING") {
    return {
      statusCode: 400,
      success: false,
      message: "Leave is already processed",
    };
  }

  leave.status = "REJECTED";
  leave.rejectedBy = user._id;

  await leave.save();

  return {
    success: true,
    message: "Leave rejected successfully",
    data: leave,
  };
};

//leave balance



exports.getLeaveBalance = async ({ user }) => {

  const userId = user._id;
  const userRole = user.role;

  const leaves = await Leave.find({
    user: userId,
    userRole,
    status: "APPROVED",
    isPaid: true,
  }).select("totalDays maxAllowed");

  let usedLeaves = 0;
  let totalAllowed = null;

  leaves.forEach((leave) => {
    usedLeaves += leave.totalDays;

    if (leave.maxAllowed !== null && leave.maxAllowed !== undefined) {
      totalAllowed = leave.maxAllowed;
    }
  });

  return {
    success: true,
    data: {
      totalAllowed,
      usedLeaves,
      remainingLeaves:
        totalAllowed !== null ? totalAllowed - usedLeaves : null,
    },
  };
};

//get leave history


exports.getLeaveHistory = async ({ user, params, query }) => {

  if (user.role !== "ADMIN") {
    return {
      statusCode: 403,
      success: false,
      message: "Only Admin can view employee leave history",
    };
  }

  const { userId } = params;

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const leaves = await Leave.find({ user: userId })

    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    success: true,
    page,
    limit,
    data: leaves,
  };
};