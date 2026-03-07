const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["ADMIN", "DOCTOR", "RECEPTIONIST", "STAFF", "PATIENT"],
      default: "PATIENT",
    },

    // Auth & Security
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    resetToken: {
      type: String,
    },

    resetTokenExp: {
      type: Date,
    },

    otpCode: {
      type: String,
    },

    otpExpiry: {
      type: Date,
    },

    lastLogin: {
      type: Date,
    },

 
//   admin: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: "Admin",
// },

// doctor: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: "Doctor",
// },

// receptionist: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: "Receptionist",
// },

// staff: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: "Staff",
// },
 },
  {
    timestamps: true, // automatically adds createdAt & updatedAt
    collection: "users",
  }
);

// Additional Indexes
//userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

module.exports = mongoose.model("User", userSchema);