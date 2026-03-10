const Joi = require("joi");

 exports.commonFields = {
  name: Joi.string()
  .trim()
  .min(2)
  .max(100)
 ,

  email: Joi.string()
  .email()
  ,

  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
  
    .messages({
      "string.pattern.base": "Phone number must be 10 digits"
    }),
     password: Joi.string()
    .min(6)
    .max(100)
   
    .messages({
      "string.min": "Password must be at least 6 characters",
      "any.required": "Password is required"
    })
    
};

exports.createReceptionistSchema = Joi.object({
    ...exports.commonFields,
    experience: Joi.number()
    .min(0),
    
    salary:Joi.number()
    .min(0),

    shift: Joi.string()
    .valid("MORNING", "EVENING", "ROTATIONAL"),
    
    gender: Joi.string()
    .valid("MALE", "FEMALE", "OTHERS"),

    aadhaar: Joi.string()
    .pattern(/^[0-9]{12}$/)
    
    .required()
    .messages({
      "string.pattern.base": "Aadhaar number must be 12 digits",
      "any.required": "Aadhaar number is required"
    }),
   
    address: Joi.string()
    .trim()
    .min(2),

    deskNumber : Joi.string()
    .trim()
    .min(2)
    .required()
    .messages({
      "any.required": "Desk number is required"
    }),
    
    shiftTiming: Joi.string()
    .trim()
    .min(2)
    .required()
    .messages({
      "any.required": "Shift timing is required"
    }),

    caneditPatient:Joi.boolean()
    .default(false),

})
exports.loginreceptionistSchema = Joi.object({
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

exports.adminUpdatereceptionistPasswordSchema = Joi.object({
   newPassword: Joi.string()
     .min(6)
     .max(100)
     .required()
     .messages({
       "string.min": "Password must be at least 6 characters",
       "any.required": "New password is required"
     })
  })

  exports.disableReceptionistSchema = Joi.object({
    isActive: Joi.boolean()
      .required()
  });

  exports.updateReceptionistSchema = Joi.object({
    ...exports.commonFields,
    experience: Joi.number()
    .min(0),
    
    salary:Joi.number()
    .min(0),

    shift: Joi.string()
    .valid("MORNING", "EVENING", "ROTATIONAL"),

    gender: Joi.string()
    .valid("MALE", "FEMALE", "OTHERS"),

    aadhaar: Joi.string()
    .pattern(/^[0-9]{12}$/)
    
   // .required()
    .messages({
      "string.pattern.base": "Aadhaar number must be 12 digits",
      "any.required": "Aadhaar number is required"
    }),

    address: Joi.string()
    .trim()
    .min(2),

    deskNumber : Joi.string()
    .trim()
    .min(2)
   // .required()
    .messages({
      "any.required": "Desk number is required"
    }),
    
    shiftTiming: Joi.string()
    .trim()
    .min(2)
    //.required()
    .messages({
      "any.required": "Shift timing is required"
    }),
    caneditPatient:Joi.boolean()
    .default(false)
  })