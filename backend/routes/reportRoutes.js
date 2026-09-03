const express = require('express');
const router = express.Router();

const { getReports, getClinicalSummary, getReportById } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/reports/summary   — Full clinical summary for Reports page
router.get('/summary', getClinicalSummary);

// GET /api/reports           — All reports (?type=Clinical Test&limit=20)
router.get('/', getReports);

// GET /api/reports/:reportId  — Single report by UUID
router.get('/:reportId', getReportById);

module.exports = router;
