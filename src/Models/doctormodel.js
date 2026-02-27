const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    // Relation to User (One-to-One)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    // Multi-tenant (Clinic reference)
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true
    },

    qualification: {
      type: String,
      required: true,
      trim: true
    },

    registrationNo: {
      type: String,
      required: true,
      unique: true,
      trim: true
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
      required: true,
      index: true
    },

    department: {
      type: String,
      required: true,
      trim: true,
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

    consultationFee: {
      type: Number
    },

    // Better structured than plain string
    availabilityDays: [{
      type: String
    }],

    documentUrl: [{
      type: String
    }]
  },
  {
    timestamps: true,
    collection: "doctors"
  }
);

// Additional performance indexes
doctorSchema.index({ createdAt: 1 });

module.exports = mongoose.model("Doctor", doctorSchema);