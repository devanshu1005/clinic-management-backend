const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    // Multi-tenant clinic boundary
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true
    },

    // Reference to User taking leave
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    userRole: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST", "STAFF"],
      required: true,
      index: true
    },

    leaveType: {
      type: String,
      enum: ["PAID", "SICK", "EMERGENCY", "CASUAL"],
      required: true
    },

    fromDate: {
      type: Date,
      required: true
    },

    toDate: {
      type: Date,
      required: true
    },

    isHalfDay: {
      type: Boolean,
      default: false
    },

    halfDayType: {
      type: String,
      enum: ["FIRST_HALF", "SECOND_HALF"]
    },

    totalDays: {
      type: Number,
      required: true
    },

    reason: {
      type: String
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true
    },

    appliedBy: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "RECEPTIONIST", "STAFF"]
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    // Policy Snapshot (very important)
    isPaid: {
      type: Boolean,
      default: true
    },

    maxAllowed: {
      type: Number
    }
  },
  {
    timestamps: true,
    collection: "leaves"
  }
);

// Compound index for date range queries
leaveSchema.index({ fromDate: 1, toDate: 1 });

module.exports = mongoose.model("Leave", leaveSchema);