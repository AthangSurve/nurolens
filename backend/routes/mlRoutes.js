const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { predictCognitiveRisk } = require('../controllers/mlController');

// POST /api/ml/predict
// Body: { moca_score, cdr_sum? }
// Auth header: Bearer <token>
router.post('/predict', protect, predictCognitiveRisk);

module.exports = router;
