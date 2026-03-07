const Joi = require("joi");

exports.createAdminSchema = Joi.object({

  /* ======================================================
     🔐 USER INFORMATION
  ====================================================== */

  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  email: Joi.string()
    .email()
    .lowercase()
    .required()
    .messages({
      "string.email": "Email must be valid",
      "any.required": "Email is required"
    }),

  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional()
    .messages({
      "string.pattern.base": "Phone must be 10 digits"
    }),

  password: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      "string.min": "Password must be at least 6 characters",
      "any.required": "Password is required"
    }),

  role: Joi.string()
    .valid("ADMIN")
    .default("ADMIN"),

  isActive: Joi.boolean().optional(),
  isVerified: Joi.boolean().optional(),


  /* ======================================================
     🏥 CLINIC INFORMATION
  ====================================================== */

  clinicName: Joi.string()
    .trim()
    .min(2)
    .max(150)
    .required(),

  location: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .required(),

subsValidity: Joi.string()
  .required()
  .custom((value, helpers) => {
    const inputDate = new Date(value);
    const now = new Date();

    if (isNaN(inputDate)) {
      return helpers.error("any.invalid");
    }

    if (inputDate <= now) {
      return helpers.error("date.future");
    }

    return value;
  })
  .messages({
    "any.required": "Subscription expiry date is required.",
    "any.invalid": "Please provide a valid subscription expiry date.",
    "date.future": "Subscription expiry date must be in the future."
  }),

  clinicLogo: Joi.string()
    .uri()
    .optional(),

  clinicPhone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional()
    .messages({
      "string.pattern.base": "Clinic phone must be 10 digits"
    }),

  clinicEmail: Joi.string()
    .email()
    .lowercase()
    .optional(),

  address: Joi.string()
    .max(500)
    .optional(),


  /* ======================================================
     🧾 BUSINESS INFORMATION
  ====================================================== */

  gstin: Joi.string()
    .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}$/)
    .optional()
    .messages({
      "string.pattern.base": "Invalid GSTIN format"
    }),

  panNumber: Joi.string()
    .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .optional()
    .messages({
      "string.pattern.base": "Invalid PAN format"
    }),

  licenseNo: Joi.string()
    .trim()
    .optional(),


  /* ======================================================
     ⏰ WORKING HOURS
  ====================================================== */

  workingHours: Joi.object()
    .pattern(
      Joi.string(),
      Joi.object({
        start: Joi.string()
          .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
          .required()
          .messages({
            "string.pattern.base": "Start time must be in HH:mm format"
          }),

        end: Joi.string()
          .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
          .required()
          .messages({
            "string.pattern.base": "End time must be in HH:mm format"
          })
      })
    )
    .optional()

})
.strict();

exports.loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.email": "Email must be valid",
      "any.required": "Email is required"
    }),

  password: Joi.string()
    .required()
    .messages({
      "any.required": "Password is required"
    })
});

exports.UpdatePasswordSchema = Joi.object({
  newPassword: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      "string.min": "Password must be at least 6 characters",
      "any.required": "New password is required"
    })
});

exports.DisableAdminschema = Joi.object({
  isActive: Joi.boolean()
    .required()
    .messages({
      "boolean.base": "isActive must be true or false",
      "any.required": "isActive field is required"
    })
}).strict();// Prevent unknown fields

// // CREATE ADMIN VALIDATION
// exports.validateCreateAdmin = (req, res, next) => {
//   const { email, adminName, phone, clinicName, location } = req.body

//   if (!email || !adminName || !phone || !clinicName || !location) {
//     return res.status(400).json({
//       success: false,
//       error: 'All fields are required: email, adminName, phone, clinicName, location'
//     })
//   }

//   next()
// }

// // DISABLE ADMIN VALIDATION
// exports.validateDisableAdmin = (req, res, next) => {
//   const { isActive } = req.body

//   if (typeof isActive !== "boolean") {
//     return res.status(400).json({
//       success: false,
//       code: "INVALID_INPUT",
//       message: "isActive must be true or false",
//     })
//   }

//   next()
// }

// // UPDATE PASSWORD VALIDATION
// exports.validateUpdatePassword = (req, res, next) => {
//   const { newPassword } = req.body

//   if (!newPassword) {
//     return res.status(400).json({
//       success: false,
//       error: "New password is required"
//     })
//   }

//   next()
// }
