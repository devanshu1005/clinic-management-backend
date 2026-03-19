const Joi = require("joi");

exports.getSalaryDashboardListSchema = Joi.object({

  userRole: Joi.string()
    .valid("STAFF", "RECEPTIONIST", "DOCTOR", "ALL")
    .required(),

  month: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .optional(),

  year: Joi.number()
    .integer()
    .optional(),

  page: Joi.number()
    .integer()
    .min(1)
    .optional(),

  limit: Joi.number()
    .integer()
    .min(1)
    .optional(),

});


exports.getSalaryDashboardSummarySchema = Joi.object({

  userRole: Joi.string()
    .valid("STAFF", "RECEPTIONIST", "DOCTOR")
    .required(),

  month: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .optional(),

  year: Joi.number()
    .integer()
    .optional(),

});