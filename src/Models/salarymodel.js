const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema(
  {
    // Multi-tenant clinic boundary
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true
    },

    // Reference to employee user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    userRole: {
      type: String,
      enum: [, "DOCTOR", "RECEPTIONIST", "STAFF"],
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: ["BONUS", "PENALTY", "REVISION"],
      required: true
    },

    amount: {
      type: Number,
      required: true
    },

    reason: {
      type: String
    },

    month: {
      type: Number,
      min: 1,
      max: 12,
      required: true
    },

    year: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true,
    collection: "salaries"
  }
);

// Compound index for salary month lookup
salarySchema.index({ month: 1, year: 1 });
salarySchema.index({ user: 1, month: 1, year: 1 });

module.exports = mongoose.model("Salary", salarySchema);