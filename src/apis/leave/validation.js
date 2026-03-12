const Joi = require("joi");

exports.applyLeaveSchema = Joi.object({
  userId: Joi.string().required(),
   adminId: Joi.string().required(),
  userRole: Joi.string().valid("ADMIN", "STAFF", "RECEPTIONIST", "DOCTOR").required(),

  leaveType: Joi.string().required(),

  fromDate: Joi.date().required(),
  toDate: Joi.date().required(),

  isHalfDay: Joi.boolean().required(),

  halfDayType: Joi.string()
    .valid("FIRST_HALF", "SECOND_HALF","null")
    .optional(),

  reason: Joi.string().required(),

  isPaid: Joi.boolean().required(),

  maxAllowed: Joi.number().required(),
});