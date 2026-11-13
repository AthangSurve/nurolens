const express = require('express');
const router = express.Router();

const { getDoctors, bookConsultation, getConsultations, cancelConsultation, completeConsultation, updateMeetingUrl } = require('../controllers/doctorController');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET  /api/doctors                          — List all doctors (?specialty=Neurologist)
router.get('/', getDoctors);

// POST /api/doctors/book                     — Book a consultation
router.post('/book', bookConsultation);

// GET  /api/doctors/consultations            — View my consultations
router.get('/consultations', getConsultations);

// PATCH /api/doctors/consultations/:id/meeting-url — Update Google Meet URL
router.patch('/consultations/:id/meeting-url', updateMeetingUrl);

// PATCH /api/doctors/consultations/:id/cancel — Cancel an upcoming consultation
router.patch('/consultations/:id/cancel', cancelConsultation);

// PATCH /api/doctors/consultations/:id/complete — Mark consultation as completed
router.patch('/consultations/:id/complete', completeConsultation);

module.exports = router;
