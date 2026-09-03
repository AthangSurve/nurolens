const express = require('express');
const router = express.Router();

const { uploadMRI, getMRIHistory } = require('../controllers/mriController');
const { protect } = require('../middleware/auth');
const { mriUpload, handleMulterError } = require('../middleware/upload');

router.use(protect);

// POST /api/mri/upload  — Upload MRI scan files (up to 10)
router.post('/upload', mriUpload, handleMulterError, uploadMRI);

// GET  /api/mri/history  — Past MRI submissions
router.get('/history', getMRIHistory);

module.exports = router;
