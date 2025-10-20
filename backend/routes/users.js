const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Report = require('../models/Report');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.getPublicProfile());
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/reports
// @desc    Get user's reports
// @access  Private
router.get('/reports', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['pending', 'verified', 'investigating', 'resolved', 'false_report'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { reporter: req.user.id };
    if (req.query.status) filter.status = req.query.status;

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('verifiedBy', 'name');

    const total = await Report.countDocuments(filter);

    res.json({
      reports,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Report.aggregate([
      { $match: { reporter: userId } },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          verifiedReports: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
          },
          pendingReports: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          resolvedReports: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          avgSeverity: { $avg: '$priority' }
        }
      }
    ]);

    const categoryStats = await Report.aggregate([
      { $match: { reporter: userId } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const monthlyStats = await Report.aggregate([
      { $match: { reporter: userId } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      overview: stats[0] || {
        totalReports: 0,
        verifiedReports: 0,
        pendingReports: 0,
        resolvedReports: 0,
        avgSeverity: 0
      },
      categoryBreakdown: categoryStats,
      monthlyTrend: monthlyStats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', [
  body('notifications.email').optional().isBoolean(),
  body('notifications.sms').optional().isBoolean(),
  body('notifications.push').optional().isBoolean(),
  body('language').optional().isIn(['en', 'tl', 'ceb']),
  body('timezone').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { preferences: req.body } },
      { new: true, runValidators: true }
    );

    res.json(user.preferences);
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
