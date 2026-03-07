const express = require("express");
const router = express.Router();
const{createDoctorSchema,disableDoctorSchema,updateDoctorSchema,adminUpdateDoctorPasswordSchema,loginSchema} = require("./validation");
const { protect, authorize, validate } = require("../../middlewares");

const {
  createDoctor,
  getDoctorProfile,
  updateDoctor,
  adminUpdateDoctorPassword,
  getAllDoctors,
  disableDoctor,
  doctorLogin,
 getisActiveDoctors,
 getinActiveDoctors
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

     router.get(
    "/active-doctors", 
    protect, 
    authorize("ADMIN", "SUPER_ADMIN"),
     responseHandler(getisActiveDoctors)); 

         router.get(
    "/inactive-doctors", 
    protect, 
    authorize("ADMIN", "SUPER_ADMIN"),
     responseHandler(getinActiveDoctors)); 



router.put(
    "/:doctorId/password", 
    protect,
      authorize("ADMIN", "SUPER_ADMIN"),
  validate(adminUpdateDoctorPasswordSchema) ,
     responseHandler(adminUpdateDoctorPassword));
     
router.put(
    "/:doctorId/disable",
     protect, authorize("ADMIN", "SUPER_ADMIN"),
     validate(disableDoctorSchema),
     responseHandler( disableDoctor)
     );

router.get(
    "/:doctorId", 
    protect, 
   
     responseHandler(getDoctorProfile)); 

router.put(
    "/update/:doctorId", 
    protect, 
    authorize("ADMIN", "SUPER_ADMIN","DOCTOR" ),
    validate(updateDoctorSchema),
     responseHandler(
        updateDoctor
    )
    ); 
      router.post(
        "/login",
        validate(loginSchema),
        responseHandler(doctorLogin)
      );


module.exports = router;


