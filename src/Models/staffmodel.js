const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    // One-to-One relation with User
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    // Multi-tenant clinic reference
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true
    },

    // Staff-specific details
    skill: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      enum: ["NURSE", "LAB_TECH", "PHARMACY", "ATTENDANT", "CLEANING", "OTHER"],
      required: true,
      index: true
    },

    experience: {
      type: String
    },

    salary: {
      type: Number,
      required: true
    },

    shift: {
      type: String,
      enum: ["MORNING", "EVENING", "ROTATIONAL"],
      required: true,
      index: true
    },

    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHERS"],
      required: true
    },

    aadhaar: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    address: {
      type: String,
      required: true
    },

    // Optional fields
    registrationNo: {
      type: String,
      trim: true
    },

    department: {
      type: String,
      trim: true,
      index: true
    },

    staffCode: {
      type: String,
      trim: true
      // If internal unique code per clinic, we can make compound index
    },

    joiningDate: {
      type: Date
    },

    roleBadge: {
      type: String
    }
  },
  {
    timestamps: true,
    collection: "staffs"
  }
);

module.exports = mongoose.model("Staff", staffSchema);