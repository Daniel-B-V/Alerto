const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Report = require('../models/Report');
const User = require('../models/User');
const WeatherData = require('../models/WeatherData');

const router = express.Router();

// Admin middleware - check if user is admin
const adminMiddleware = (req, res, next) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin)
router.get('/dashboard', adminMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get report statistics
    const reportStats = await Report.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          last24h: [
            { $match: { createdAt: { $gte: last24Hours } } },
            { $count: 'count' }
          ],
          last7d: [
            { $match: { createdAt: { $gte: last7Days } } },
            { $count: 'count' }
          ],
          last30d: [
            { $match: { createdAt: { $gte: last30Days } } },
            { $count: 'count' }
          ],
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          bySeverity: [
            {
              $group: {
                _id: '$severity',
                count: { $sum: 1 }
              }
            }
          ],
          byCategory: [
            {
              $group: {
                _id: '$category',
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    // Get user statistics
    const userStats = await User.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          byRole: [
            {
              $group: {
                _id: '$role',
                count: { $sum: 1 }
              }
            }
          ],
          activeUsers: [
            { $match: { lastLogin: { $gte: last7Days } } },
            { $count: 'count' }
          ]
        }
      }
    ]);

    // Get top reporters
    const topReporters = await Report.aggregate([
      {
        $group: {
          _id: '$reporter',
          reportCount: { $sum: 1 },
          verifiedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
          }
        }
      },
      { $sort: { reportCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          name: '$user.name',
          email: '$user.email',
          location: '$user.location',
          reportCount: 1,
          verifiedCount: 1,
          verificationRate: {
            $multiply: [
              { $divide: ['$verifiedCount', '$reportCount'] },
              100
            ]
          }
        }
      }
    ]);

    // Get location-based statistics
    const locationStats = await Report.aggregate([
      {
        $group: {
          _id: {
            city: '$location.city',
            province: '$location.province'
          },
          reportCount: { $sum: 1 },
          criticalReports: {
            $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
          }
        }
      },
      { $sort: { reportCount: -1 } },
      { $limit: 20 }
    ]);

    res.json({
      reports: {
        total: reportStats[0].total[0]?.count || 0,
        last24h: reportStats[0].last24h[0]?.count || 0,
        last7d: reportStats[0].last7d[0]?.count || 0,
        last30d: reportStats[0].last30d[0]?.count || 0,
        byStatus: reportStats[0].byStatus,
        bySeverity: reportStats[0].bySeverity,
        byCategory: reportStats[0].byCategory
      },
      users: {
        total: userStats[0].total[0]?.count || 0,
        byRole: userStats[0].byRole,
        activeUsers: userStats[0].activeUsers[0]?.count || 0
      },
      topReporters,
      locationStats,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/reports
// @desc    Get all reports for admin management
// @access  Private (Admin)
router.get('/reports', adminMiddleware, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'verified', 'investigating', 'resolved', 'false_report']),
  query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
  query('sortBy').optional().isIn(['createdAt', 'priority', 'severity', 'status']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.severity) filter.severity = req.query.severity;

    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const reports = await Report.find(filter)
      .populate('reporter', 'name email location')
      .populate('verifiedBy', 'name')
      .populate('resolution.resolvedBy', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit);

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
    console.error('Admin reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/reports/:id/status
// @desc    Update report status
// @access  Private (Admin)
router.put('/reports/:id/status', adminMiddleware, [
  body('status').isIn(['pending', 'verified', 'investigating', 'resolved', 'false_report']).withMessage('Invalid status'),
  body('resolution').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, resolution } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const updatedReport = await report.updateStatus(status, req.user.id, resolution?.description);

    // Emit real-time update
    req.io.emit('report-status-updated', {
      reportId: req.params.id,
      status,
      updatedBy: req.user.name
    });

    res.json(updatedReport);
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users for admin management
// @access  Private (Admin)
router.get('/users', adminMiddleware, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['user', 'reporter', 'admin', 'super_admin']),
  query('search').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.search) {
      filter.$or = [
        { name: new RegExp(req.query.search, 'i') },
        { email: new RegExp(req.query.search, 'i') }
      ];
    }

    const users = await User.find(filter)
      .select('-password -verificationToken -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private (Super Admin)
router.put('/users/:id/role', [
  body('role').isIn(['user', 'reporter', 'admin', 'super_admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Super admin access required' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
