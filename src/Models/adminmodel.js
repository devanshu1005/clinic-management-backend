const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    // Relation to User (One-to-One)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    // Clinic Information
    clinicName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    location: {
      type: String,
      required: true,
      trim: true
    },

    subsValidity: {
      type: Date,
      required: true,
      index: true
    },


    clinicLogo: {
      type: String
    },

    clinicPhone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },

    clinicEmail: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true
    },

    address: {
      type: String
    },

    // Business Details
    gstin: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },

    panNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },

    licenseNo: {
      type: String,
      trim: true
    },

    // Structured Working Hours
    workingHours: {
      type: Object
    }
  },
  {
    timestamps: true,
    collection: "admins"
  }
);

// Additional indexes for performance
adminSchema.index({ createdAt: 1 });
//adminSchema.index({ subsValidity: 1 });

module.exports = mongoose.model("Admin", adminSchema);