const express = require("express");
const router = express.Router();
const{addSalaryEntrySchema,updateBaseSalarySchema,getEmployeeSalaryDetailsSchema, getEmployeePayslipSchema
}=require("./Validation.js")


const{addSalaryEntry,updateBaseSalary,getSalaryHistory,getEmployeeSalaryDetails,downloadPayslip
}=require("./controller")
const { protect, authorize, validate } = require("../../middlewares");
const responseHandler = require("../../utils/responseHandler");

router.post(
    "/add-Salary-Entry",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    validate(addSalaryEntrySchema),
    responseHandler(addSalaryEntry)
)

router.put(
    "/update",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    validate(updateBaseSalarySchema),
    responseHandler(updateBaseSalary)
)

router.get(
    "/history/:userId/:userRole",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    responseHandler(getSalaryHistory)
)

router.get(
    "/details",
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
     validate(getEmployeeSalaryDetailsSchema, "query"),
    responseHandler(getEmployeeSalaryDetails)
)

router.get("/payslip", 
    protect, 
     validate(getEmployeePayslipSchema, "query"),
   downloadPayslip)
module.exports = router;