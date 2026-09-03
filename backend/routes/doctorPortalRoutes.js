const express = require('express');
const router  = express.Router();
const { protect, protectDoctor } = require('../middleware/auth');
const ctrl = require('../controllers/doctorPortalController');

// All routes require a valid JWT + doctor role
router.use(protect, protectDoctor);

router.get('/me',                          ctrl.getDoctorProfile);
router.get('/patients',                    ctrl.getAllPatients);
router.get('/patients/:patientId',         ctrl.getPatientDetails);
router.post('/prescriptions',              ctrl.prescribeMRI);
router.post('/notes',                      ctrl.addDoctorNote);

module.exports = router;
