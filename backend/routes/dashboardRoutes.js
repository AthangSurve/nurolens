const express = require('express');
const router = express.Router();

const { getDashboardData } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

// GET /api/dashboard — Full dashboard data in one call
router.get('/', protect, getDashboardData);

module.exports = router;
