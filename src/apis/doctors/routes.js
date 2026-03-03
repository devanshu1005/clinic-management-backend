const express = require("express");
const router = express.Router();
const{createDoctorSchema,disableDoctorSchema,updateDoctorSchema,adminUpdateDoctorPasswordSchema} = require("./validation");
const { protect, authorize, validate } = require("../../middlewares");

const {
  createDoctor,
  getDoctorProfile,
  updateDoctor,
  adminUpdateDoctorPassword,
  getAllDoctors,
  disableDoctor
} = require("./controller");
const responseHandler = require("../../utils/responseHandler");


router.post(
    "/create-doctor",
     protect,
 authorize("ADMIN", "SUPER_ADMIN"),
  validate(createDoctorSchema),
     responseHandler(createDoctor));

router.get(
    "/all-doctors", 
    protect, 
    authorize("ADMIN", "SUPER_ADMIN"),
     responseHandler(getAllDoctors)); 

router.put(
    "/:doctorId/password", 
    protect,
      authorize("ADMIN", "SUPER_ADMIN"),
  validate(adminUpdateDoctorPasswordSchema) ,
     responseHandler(adminUpdateDoctorPassword));
router.put(
    "/:doctorId/status",
     protect, authorize("ADMIN", "SUPER_ADMIN"),
     validate(disableDoctorSchema),
     responseHandler( disableDoctor)
     );

router.get(
    "/:doctorId", 
    protect, 
   
     responseHandler(getDoctorProfile)); 

router.put(
    "/:doctorId", 
    protect, 
    authorize("ADMIN", "SUPER_ADMIN"),
    validate(updateDoctorSchema),
     responseHandler(
        updateDoctor
    )
    ); 


module.exports = router;


