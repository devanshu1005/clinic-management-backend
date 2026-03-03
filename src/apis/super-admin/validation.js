const Joi = require("joi");



exports.loginSuperAdminSchema = Joi.object({

email: Joi.string()
    .email()
    .lowercase()
    .required()
    .messages({
      "string.email": "Email must be valid",
      "any.required": "Email is required"
    }),

   password: Joi.string()
     .min(6)
     .max(100)
     .required()
     .messages({
       "string.min": "Password must be at least 6 characters",
       "any.required": "Password is required"
     }),
 
});