const mongoose = require("mongoose");

const receptionistSchema = new mongoose.Schema(
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

    // Receptionist Details
    experience: {
      type: String
    },

    shift: {
      type: String,
      enum: ["MORNING", "EVENING", "ROTATIONAL"],
      required: true,
      index: true
    },

    salary: {
      type: Number,
      required: true
    },

    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHERS"],
      required: true,
      index: true
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

    canEditPatient: {
      type: Boolean,
      default: false
    },

    // Optional fields
    deskNumber: {
      type: String,
      trim: true
    },

    shiftTiming: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    collection: "receptionists"
  }
);

module.exports = mongoose.model("Receptionist", receptionistSchema);