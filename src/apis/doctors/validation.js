
const Joi = require("joi");

 exports.commonFields = {
  name: Joi.string()
  .trim()
  .min(2)
  .max(100)
  .required(),

  email: Joi.string()
  .email()
  .required(),

  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone number must be 10 digits"
    }),
     password: Joi.string()
        .min(6)
        .max(100)
        .required()
        .messages({
          "string.min": "Password must be at least 6 characters",
          "any.required": "Password is required"
        })
};



exports.createDoctorSchema = Joi.object({  
  ...exports.commonFields,
  // name: Joi.string()
  //   .trim()
  //   .min(2)
  //   .max(100)
  //   .required(),

  // email: Joi.string()
  //   .email()
  //   .required(),

  // phone: Joi.string()
  //   .pattern(/^[0-9]{10}$/)
  //   .required()
  //   .messages({
  //     "string.pattern.base": "Phone number must be 10 digits"
  //   }),

  qualification: Joi.string()
    .trim()
    .min(2)
    .max(150),

  registrationNo: Joi.string()
    .trim()
    .min(5)
    .max(50),

  department: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  salary: Joi.number()
    .min(0)
    .required()
    .messages({
      "number.base": "Salary must be numeric"
    }),

  shift: Joi.string()
    .valid("MORNING", "EVENING", "ROTATIONAL"),

  gender: Joi.string()
    .valid("MALE", "FEMALE", "OTHERS"),

  aadhaar: Joi.string()
    .pattern(/^[0-9]{12}$/)
    .required()
    .messages({
      "string.pattern.base": "Aadhaar must be 12 digits"
    }),

  address: Joi.string()
    .trim()
    .min(5)
    .max(500),

  experience: Joi.number()
    .integer()
    .min(0)
    .max(60),

  consultationFee: Joi.number()
    .min(0),

  availabilityDays: Joi.array()
    .items(
      Joi.string().valid(
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY"
      )
    )
    .min(1)
    .max(7)
    .unique(),

  documentUrl: Joi.array().items(
    Joi.object({
      name: Joi.string().trim().max(100),

      url: Joi.string()
        .uri({ scheme: ["http", "https"] }),

      uploadedAt: Joi.date()
    })
  )

}).strict();

// module.exports = {
//   createDoctorSchema
// };



exports.updateDoctorSchema = Joi.object({  

  // name: Joi.string()
  //   .trim()
  //   .min(2)
  //   .max(100),

  // phone: Joi.string()
  //   .pattern(/^[0-9]{10}$/)
  //   .messages({
  //     "string.pattern.base": "Phone number must be 10 digits"
  //   }),

  qualification: Joi.string()
    .trim()
    .min(2)
    .max(150),

  registrationNo: Joi.string()
    .trim()
    .min(5)
    .max(50),

  salary: Joi.number()
    .min(0),

  shift: Joi.string()
    .valid("MORNING", "EVENING", "ROTATIONAL"),

  gender: Joi.string()
    .valid("MALE", "FEMALE", "OTHERS"),

  department: Joi.string()
    .trim()
    .min(2)
    .max(100),

  aadhaar: Joi.string()
    .pattern(/^[0-9]{12}$/)
    .optional()
    
    .messages({
      "string.pattern.base": "Aadhaar must be 12 digits"
    }),

  address: Joi.string()
    .trim()
    .min(5)
    .max(500),

  experience: Joi.number()
    .integer()
    .min(0)
    .max(60),

  consultationFee: Joi.number()
    .min(0),

  availabilityDays: Joi.array()
    .items(
      Joi.string().valid(
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY"
      )
    )
    .min(1)
    .max(7)
    .unique(),

  documentUrl: Joi.array().items(
    Joi.object({
      name: Joi.string().trim().max(100),

      url: Joi.string().uri({
        scheme: ["http", "https"]
      }),

      uploadedAt: Joi.date()
    })
  )

}).min(1).strict();

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

exports.adminUpdateDoctorPasswordSchema = Joi.object({
  newPassword: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      "string.min": "Password must be at least 6 characters",
      "any.required": "New password is required"
    })
});
exports.disableDoctorSchema = Joi.object({
  isActive: Joi.boolean()
    .required()
    .messages({
      "boolean.base": "isActive must be true or false",
      "any.required": "isActive field is required"
    })
})