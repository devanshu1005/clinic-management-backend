const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { User , Admin} = require("../models");

const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token properly
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Not authorized. No token provided.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ==============================
    // HANDLE SUPER ADMIN (.env based)
    // ==============================
    if (
      decoded.role === "SUPER_ADMIN" &&
      decoded.email === process.env.SUPER_ADMIN_EMAIL
    ) {
      req.user = {
        id: decoded.id,
        role: "SUPER_ADMIN",
        email: decoded.email,
        name: "Super Admin",
        username: process.env.SUPER_ADMIN_USERNAME || "appVibe",
      };
      return next();
    }

    // ==============================
    // VALIDATE OBJECT ID
    // ==============================
    if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
      return res.status(401).json({
        success: false,
        error: "Invalid user ID",
      });
    }

    // ==============================
    // FIND USER (Mongoose way)
    // ==============================
    const userInfo = await User.findById(decoded.id)
      .select("email name role isActive Admin")
      // .populate({
      //   path: "admin",
      //   select: "clinicName location subsValidity",
      // });
console.log( userInfo)
    if (!userInfo) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    if (!userInfo.isActive) {
      return res.status(403).json({
        success: false,
        error: "Account is inactive. Contact support.",
      });
    }

    // ==============================
    // CHECK ADMIN SUBSCRIPTION
    // ==============================
    if (userInfo.role === "ADMIN") {
      // if (!userInfo.Admin) {
      //   return res.status(403).json({
      //     success: false,
      //     error: "Admin profile not found",
      //   });
      // }
   
      const admin = await Admin.findOne({ user: userInfo._id });
      if (!admin) {
        return res.status(403).json({
          success: false,
          error: "Admin profile not found",
        });
      }

      if (
        admin.subsValidity &&
        new Date(admin.subsValidity) < new Date()
      ) {
        return res.status(403).json({
          success: false,
          error: "Subscription expired. Please renew to continue.",
        });
      }
    }

    req.user = userInfo;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expired. Please login again.",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Authentication failed",
    });
  }
};

module.exports = { protect };