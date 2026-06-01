const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getParentDashboardData } = require('../services/dashboardService');
const Student = require('../models/Student');
const Notice = require('../models/Notice');

const router = express.Router();

const formatDate = (value) => (value ? new Date(value).toISOString() : null);

const getParentClassIds = async (userId) => {
  const children = await Student.find({ parentId: userId }).select('class').lean();
  return children.map((child) => String(child.class)).filter(Boolean);
};

const markNoticesAsRead = async (noticeIds, userId) => {
  if (!noticeIds.length) return;
  await Notice.updateMany({ _id: { $in: noticeIds } }, { $addToSet: { readBy: userId } });
};

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

router.get('/notices', authenticate, authorize('parent'), async (req, res) => {
  try {
    const classIds = await getParentClassIds(req.user.id);
    const notices = await Notice.find({
      $or: [
        { targetAudience: { $in: ['parent'] } },
        { targetClass: { $in: classIds } }
      ]
    }).sort({ createdAt: -1 }).lean();

    await markNoticesAsRead(notices.map((notice) => notice._id), req.user.id);

    res.json({
      success: true,
      notices: notices.map((notice) => ({
        id: notice._id,
        title: notice.title,
        content: notice.content,
        category: notice.category,
        date: formatDate(notice.createdAt),
        isUrgent: notice.isUrgent,
        isRead: true,
        attachment: notice.attachments?.[0] || null,
        targetAudience: notice.targetAudience || []
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/notices/mark-read', authenticate, authorize('parent'), async (req, res) => {
  try {
    const classIds = await getParentClassIds(req.user.id);
    const notices = await Notice.find({
      $or: [
        { targetAudience: { $in: ['parent'] } },
        { targetClass: { $in: classIds } }
      ]
    }).select('_id').lean();

    await markNoticesAsRead(notices.map((notice) => notice._id), req.user.id);
    res.json({ success: true, message: 'Notices marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/events', authenticate, authorize('parent'), (req, res) => {
  res.json({ success: true, events: [] });
});

module.exports = router;
