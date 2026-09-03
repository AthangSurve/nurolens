const express = require('express');
const router = express.Router();

const { uploadSpeech, getSpeechHistory } = require('../controllers/speechController');
const { protect } = require('../middleware/auth');
const { speechUpload, handleMulterError } = require('../middleware/upload');

router.use(protect);

// POST /api/speech/upload  — Upload audio recording
router.post('/upload', speechUpload, handleMulterError, uploadSpeech);

// GET  /api/speech/history  — Past speech analyses
router.get('/history', getSpeechHistory);

module.exports = router;
