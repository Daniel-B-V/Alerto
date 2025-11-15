const express = require('express');
const { body, validationResult, query } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Report = require('../models/Report');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/reports';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// @route   GET /api/reports
// @desc    Get all reports with filtering and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'verified', 'investigating', 'resolved', 'false_report', 'rejected']),
  query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
  query('category').optional().isIn(['flooding', 'traffic', 'power', 'infrastructure', 'weather', 'emergency', 'other']),
  query('city').optional().isString(),
  query('province').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { isPublic: true };
    
    if (req.query.status) filter.status = req.query.status;
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.city) filter['location.city'] = new RegExp(req.query.city, 'i');
    if (req.query.province) filter['location.province'] = new RegExp(req.query.province, 'i');

    const reports = await Report.find(filter)
      .populate('reporter', 'name avatar location')
      .populate('verifiedBy', 'name')
      .sort({ createdAt: -1 })
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
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/:id
// @desc    Get single report
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reporter', 'name avatar location stats')
      .populate('verifiedBy', 'name')
      .populate('resolution.resolvedBy', 'name');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reports
// @desc    Create new report
// @access  Private
router.post('/', authMiddleware, upload.array('images', 5), [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
  body('category').isIn(['flooding', 'traffic', 'power', 'infrastructure', 'weather', 'emergency', 'other']).withMessage('Invalid category'),
  body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
  body('location.barangay').trim().notEmpty().withMessage('Barangay is required'),
  body('location.city').trim().notEmpty().withMessage('City is required'),
  body('location.province').trim().notEmpty().withMessage('Province is required'),
  body('location.coordinates.lat').isFloat().withMessage('Valid latitude required'),
  body('location.coordinates.lng').isFloat().withMessage('Valid longitude required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Role-based submission check: Only community_member can submit reports
    if (req.user.role === 'mayor' || req.user.role === 'governor') {
      return res.status(403).json({
        message: 'Mayors and governors cannot submit reports. Only community members can submit reports.'
      });
    }

    const reportData = {
      ...req.body,
      reporter: req.user.id,
      images: req.files ? req.files.map(file => ({
        url: `/uploads/reports/${file.filename}`,
        filename: file.filename
      })) : []
    };

    const report = new Report(reportData);
    await report.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.reportsSubmitted': 1 }
    });

    // Emit real-time update
    req.io.emit('new-report', {
      report: await Report.findById(report._id).populate('reporter', 'name avatar location')
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/reports/:id
// @desc    Update report
// @access  Private (Owner or Admin)
router.put('/:id', authMiddleware, [
  body('title').optional().trim().isLength({ min: 5, max: 200 }),
  body('description').optional().trim().isLength({ min: 10, max: 2000 }),
  body('status').optional().isIn(['pending', 'verified', 'investigating', 'resolved', 'false_report', 'rejected'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user can update (owner or admin)
    if (report.reporter.toString() !== req.user.id && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate('reporter', 'name avatar location');

    // Emit real-time update
    req.io.emit('report-updated', { report: updatedReport });

    res.json(updatedReport);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/reports/:id
// @desc    Delete report
// @access  Private (Owner or Admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user can delete (owner or admin)
    if (report.reporter.toString() !== req.user.id && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete associated images
    report.images.forEach(image => {
      const imagePath = path.join('uploads/reports', image.filename);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    });

    await Report.findByIdAndDelete(req.params.id);

    // Emit real-time update
    req.io.emit('report-deleted', { reportId: req.params.id });

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reports/:id/like
// @desc    Like/unlike a report
// @access  Private
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const userId = req.user.id;
    const isLiked = report.interactions.likes.includes(userId);

    if (isLiked) {
      report.interactions.likes.pull(userId);
    } else {
      report.interactions.likes.push(userId);
    }

    await report.save();

    res.json({ 
      liked: !isLiked, 
      likesCount: report.interactions.likes.length 
    });
  } catch (error) {
    console.error('Error liking report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reports/:id/comment
// @desc    Add comment to report
// @access  Private
router.post('/:id/comment', authMiddleware, [
  body('text').trim().isLength({ min: 1, max: 500 }).withMessage('Comment must be 1-500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const comment = {
      user: req.user.id,
      text: req.body.text
    };

    report.interactions.comments.push(comment);
    await report.save();

    const updatedReport = await Report.findById(req.params.id)
      .populate('interactions.comments.user', 'name avatar');

    // Emit real-time update
    req.io.emit('report-commented', { 
      reportId: req.params.id, 
      comment: updatedReport.interactions.comments[updatedReport.interactions.comments.length - 1]
    });

    res.json(updatedReport.interactions.comments[updatedReport.interactions.comments.length - 1]);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reports/:id/verify
// @desc    Verify a report (Mayor/Governor only)
// @access  Private (Mayor/Governor)
router.post('/:id/verify', authMiddleware, async (req, res) => {
  try {
    // Check if user is mayor or governor
    if (req.user.role !== 'mayor' && req.user.role !== 'governor') {
      return res.status(403).json({
        message: 'Only mayors and governors can verify reports'
      });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check jurisdiction
    const userCity = req.user.location?.city?.toLowerCase().replace(/\s+/g, '_');
    const userProvince = req.user.location?.province?.toLowerCase().replace(/\s+/g, '_');
    const reportCity = report.location.city.toLowerCase().replace(/\s+/g, '_');
    const reportProvince = report.location.province.toLowerCase().replace(/\s+/g, '_');

    if (req.user.role === 'mayor' && userCity !== reportCity) {
      return res.status(403).json({
        message: 'You can only verify reports in your city'
      });
    }

    if (req.user.role === 'governor' && userProvince !== reportProvince) {
      return res.status(403).json({
        message: 'You can only verify reports in your province'
      });
    }

    // Update report status to verified
    report.status = 'verified';
    report.verifiedBy = req.user.id;
    report.verifiedAt = new Date();
    report.isSpam = false; // Clear spam flag if verified

    await report.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.reportsVerified': 1 }
    });

    const updatedReport = await Report.findById(req.params.id)
      .populate('reporter', 'name avatar location')
      .populate('verifiedBy', 'name');

    // Emit real-time update
    req.io.emit('report-verified', { report: updatedReport });

    res.json(updatedReport);
  } catch (error) {
    console.error('Error verifying report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reports/:id/reject
// @desc    Reject a report as spam (Mayor/Governor only)
// @access  Private (Mayor/Governor)
router.post('/:id/reject', authMiddleware, [
  body('reason').optional().trim().isLength({ min: 5, max: 500 }).withMessage('Reason must be 5-500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is mayor or governor
    if (req.user.role !== 'mayor' && req.user.role !== 'governor') {
      return res.status(403).json({
        message: 'Only mayors and governors can reject reports'
      });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check jurisdiction
    const userCity = req.user.location?.city?.toLowerCase().replace(/\s+/g, '_');
    const userProvince = req.user.location?.province?.toLowerCase().replace(/\s+/g, '_');
    const reportCity = report.location.city.toLowerCase().replace(/\s+/g, '_');
    const reportProvince = report.location.province.toLowerCase().replace(/\s+/g, '_');

    if (req.user.role === 'mayor' && userCity !== reportCity) {
      return res.status(403).json({
        message: 'You can only reject reports in your city'
      });
    }

    if (req.user.role === 'governor' && userProvince !== reportProvince) {
      return res.status(403).json({
        message: 'You can only reject reports in your province'
      });
    }

    // Update report status to rejected
    report.status = 'rejected';
    report.rejectedBy = req.user.id;
    report.rejectedAt = new Date();
    report.rejectionReason = req.body.reason || 'Report rejected as spam or invalid';
    report.isSpam = true;

    // Update spam details
    report.spamDetails = {
      flaggedBy: req.user.id,
      flaggedAt: new Date(),
      reason: req.body.reason || 'Rejected by official',
      aiConfidence: report.aiAnalysis?.confidence || 0
    };

    await report.save();

    const updatedReport = await Report.findById(req.params.id)
      .populate('reporter', 'name avatar location')
      .populate('rejectedBy', 'name');

    // Emit real-time update
    req.io.emit('report-rejected', { report: updatedReport });

    res.json(updatedReport);
  } catch (error) {
    console.error('Error rejecting report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
