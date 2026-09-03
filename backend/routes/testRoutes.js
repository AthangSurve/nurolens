const express = require('express');
const router = express.Router();

const { submitMMSE, submitMoCA, getTestHistory, getLatestScores } = require('../controllers/testController');
const { protect } = require('../middleware/auth');

// All test routes require authentication
router.use(protect);

// POST /api/tests/mmse  — Submit MMSE answers
router.post('/mmse', submitMMSE);

// POST /api/tests/moca  — Submit MoCA answers
router.post('/moca', submitMoCA);

// GET  /api/tests/history  — Get all past test results (?test_type=MMSE&limit=10)
router.get('/history', getTestHistory);

// GET  /api/tests/latest-scores  — Get newest MMSE + MoCA for dashboard
router.get('/latest-scores', getLatestScores);

module.exports = router;
