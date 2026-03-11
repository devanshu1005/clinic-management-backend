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

exports.createStaffSchema = Joi.object({
    ...exports.commonFields,


  skill: Joi.string().trim().required(),

  category: Joi.string().trim().required(),

  experience: Joi.number().min(0).required(),

  salary: Joi.number().min(0).required(),

  shift: Joi.string().valid("MORNING", "EVENING", "NIGHT").required(),

  gender: Joi.string().valid("MALE", "FEMALE", "OTHER").required(),

  aadhaar: Joi.string()
    .pattern(/^[0-9]{12}$/)
    .required()
    .messages({
      "string.pattern.base": "Aadhaar must be 12 digits",
    }),

  address: Joi.string().required(),

  registrationNo: Joi.string().optional(),

  department: Joi.string().required(),

  staffCode: Joi.string().required(),

  joiningDate: Joi.date().required(),

  roleBadge: Joi.string().optional(),
});


exports.loginstaffSchema = Joi.object({
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

exports.adminUpdatestaffPasswordSchema = Joi.object({
   newPassword: Joi.string()
     .min(6)
     .max(100)
     //.required()
     .messages({
       "string.min": "Password must be at least 6 characters",
       "any.required": "New password is required"
     })
  })

  exports.disablestafftSchema = Joi.object({
    isActive: Joi.boolean()
      .required()
  })

  exports.updatestaffSchema = Joi.object({
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
    .messages({
      "string.pattern.base": "Aadhaar must be 12 digits",
    }),

    address: Joi.string(),

    registrationNo: Joi.string().optional(),

    department: Joi.string(),

    staffCode: Joi.string(),

    joiningDate: Joi.date(),

    roleBadge: Joi.string().optional(),
  })