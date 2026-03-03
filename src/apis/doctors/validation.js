   // if (typeof isActive !== "boolean") {
    //   return res.status(400).json({
    //     success: false,
    //     code: "INVALID_INPUT",
    //     message: "isActive must be true or false",
    //   });
    // }

        // if (!newPassword) {
    //   return res.status(400).json({
    //     success: false,
    //     error: "New password is required",
    //   });
    // }
    
   const Joi = require("joi");
    exports.createDoctorSchema = Joi.object({
        
    

    //Reation Fiels

    user: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
        "string.length": "Invalid user ID"
    }),

  admin: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
        "string.length": "Invalid admin ID"
    }),

// professoional details
  qualification: Joi.string()
    .trim()
    .min(2)
    .max(150)
    .required(),

  registrationNo: Joi.string()
    .trim()
    .min(5)
    .max(50)
    .required(),

  experience: Joi.number()
    .integer()
    .min(0)
    .max(60)
    .required()
    .messages({
      "number.base": "Experience must be a number",
      "number.min": "Experience cannot be negative"
    }),

  department: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required(),

     salary: Joi.number()
    .min(0)
    .required()
    .messages({
      "number.base": "Salary must be numeric",
      "number.min": "Salary cannot be negative"
    }),

  consultationFee: Joi.number()
    .min(0)
    .optional(),
    gender: Joi.string()
    .valid("MALE", "FEMALE", "OTHERS")
    .required(),

  aadhaar: Joi.string()
    .pattern(/^[0-9]{12}$/)
    .required()
    .messages({
      "string.pattern.base": "Aadhaar must be 12 digits"
    }),

  address: Joi.string()
    .trim()
    .min(5)
    .max(500)
    .required(),

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
  .unique()
    .required(),

      shift: Joi.string()
    .valid("MORNING", "EVENING", "ROTATIONAL")
    .required(),


      documentUrl: Joi.array()

  .items(
    Joi.object({
      name: Joi.string()
        .required(),

      url: Joi.string()
        .uri({ scheme: ["http", "https"] })
        .required(),

      uploadedAt: Joi.date().required()
    })
  )

})
.strict();
    