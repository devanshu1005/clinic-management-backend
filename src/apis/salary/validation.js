const Joi = require("joi");

exports.addSalaryEntrySchema = Joi.object({
  userId: Joi.string().required(),

  userRole: Joi.string()
    .valid("STAFF", "RECEPTIONIST", "DOCTOR")
    .required()
    .messages({
      "any.only":
        "Salary allowed only for Staff, Receptionist, or Doctor",
    }),

  type: Joi.string()
    .valid("BONUS", "PENALTY", "REVISION")
    .required()
    .messages({
      "any.only": "Invalid salary type",
    }),

  amount: Joi.number()
    .greater(0)
    .required()
    .messages({
      "number.greater": "Amount must be greater than zero",
    }),

  reason: Joi.string().allow(" "),

  month: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .required()
    .messages({
      "number.min": "Month must be between 1 and 12",
      "number.max": "Month must be between 1 and 12",
    }),

  year: Joi.number().integer().required(),
});



exports.updateBaseSalarySchema = Joi.object({

  userId: Joi.string().required(),

  userRole: Joi.string()
    .valid("STAFF", "RECEPTIONIST", "DOCTOR")
    .required()
    .messages({
      "any.only": "Invalid user role for salary update",
    }),

  newSalary: Joi.number()
    .greater(0)
    .required(),

  reason: Joi.string().allow("", null),

  month: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .required(),

  year: Joi.number()
    .integer()
    .required(),
});



exports.getEmployeeSalaryDetailsSchema = Joi.object({

  userId: Joi.string()
    .required(),

  userRole: Joi.string()
    .valid("STAFF", "RECEPTIONIST", "DOCTOR")
    .required(),

  year: Joi.number()
    .integer()
    .required(),

  month: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .optional()

});

exports.getEmployeePayslipSchema = Joi.object({

  userId: Joi.string()
    .required(),

  userRole: Joi.string()
    .valid("STAFF", "RECEPTIONIST", "DOCTOR")
    .required(),

  year: Joi.number()
    .integer()
    .required(),

  month: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .optional()
})