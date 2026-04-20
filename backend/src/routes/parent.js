const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getParentDashboardData } = require('../services/dashboardService');

const router = express.Router();

// Parent routes
router.get('/dashboard', authenticate, authorize('parent'), async (req, res) => {
  try {
    const data = await getParentDashboardData(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/children', authenticate, authorize('parent'), (req, res) => {
  res.json({ success: true, children: [] });
});

router.get('/children/:childId/attendance', authenticate, authorize('parent'), (req, res) => {
  res.json({ success: true, attendance: [] });
});

router.get('/children/:childId/marks', authenticate, authorize('parent'), (req, res) => {
  res.json({ success: true, marks: [] });
});

router.get('/children/:childId/assignments', authenticate, authorize('parent'), (req, res) => {
  res.json({ success: true, assignments: [] });
});

router.get('/fees', authenticate, authorize('parent'), (req, res) => {
  res.json({ success: true, fees: [] });
});

router.get('/notices', authenticate, authorize('parent'), (req, res) => {
  res.json({ success: true, notices: [] });
});

router.get('/events', authenticate, authorize('parent'), (req, res) => {
  res.json({ success: true, events: [] });
});

module.exports = router;
