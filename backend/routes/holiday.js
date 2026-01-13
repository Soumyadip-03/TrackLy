const express = require('express');
const router = express.Router();
const Holiday = require('../models/Holiday');
const AcademicPeriod = require('../models/AcademicPeriod');
const { protect } = require('../middleware/auth');

// @desc    Add holiday range
// @route   POST /api/holidays/range
// @access  Private
router.post('/range', protect, async (req, res) => {
  try {
    console.log('📥 [HOLIDAY RANGE] Request body:', req.body);
    const { startDate, endDate, reason, semester } = req.body;

    if (!startDate || !semester) {
      console.log('❌ [HOLIDAY RANGE] Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Start date and semester are required'
      });
    }
    
    if (!reason || reason.trim() === '') {
      console.log('❌ [HOLIDAY RANGE] Missing reason');
      return res.status(400).json({
        success: false,
        error: 'Reason is required for holidays'
      });
    }
    
    const academicPeriod = await AcademicPeriod.findOne({
      userId: req.user.id,
      semester: semester
    });
    
    if (!academicPeriod) {
      console.log('❌ [HOLIDAY RANGE] Academic period not found for semester:', semester);
      return res.status(404).json({
        success: false,
        error: 'Academic period not found for this semester'
      });
    }
    
    console.log('✅ [HOLIDAY RANGE] Academic period found:', academicPeriod._id);
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(startDate);
    const holidays = [];
    
    console.log('📅 [HOLIDAY RANGE] Creating holidays from', start.toISOString().split('T')[0], 'to', end.toISOString().split('T')[0]);
    
    const currentDate = new Date(start);
    while (currentDate <= end) {
      try {
        const holiday = await Holiday.create({
          academicPeriodId: academicPeriod._id,
          userId: req.user.id,
          date: new Date(currentDate),
          reason: reason
        });
        holidays.push(holiday);
        console.log('✅ [HOLIDAY RANGE] Created holiday for:', currentDate.toISOString().split('T')[0]);
      } catch (err) {
        if (err.code !== 11000) {
          console.log('❌ [HOLIDAY RANGE] Error creating holiday:', err.message);
          throw err;
        }
        console.log('⏭️  [HOLIDAY RANGE] Skipping duplicate for:', currentDate.toISOString().split('T')[0]);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('🎉 [HOLIDAY RANGE] Created', holidays.length, 'holidays');
    res.status(200).json({
      success: true,
      data: holidays,
      count: holidays.length
    });
  } catch (err) {
    console.error('❌ [HOLIDAY RANGE] Error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get holidays for a specific academic period
// @route   GET /api/holidays/:semester
// @access  Private
router.get('/:semester', protect, async (req, res) => {
  try {
    // Find academic period for this semester
    const academicPeriod = await AcademicPeriod.findOne({
      userId: req.user.id,
      semester: req.params.semester
    });
    
    if (!academicPeriod) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    // Get holidays for this academic period
    const holidays = await Holiday.find({ academicPeriodId: academicPeriod._id }).sort({ date: 1 });
    
    res.status(200).json({
      success: true,
      data: holidays
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get all holidays for user
// @route   GET /api/holidays
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const holidays = await Holiday.find({ userId: req.user.id }).sort({ date: 1 });
    
    res.status(200).json({
      success: true,
      data: holidays
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Add holiday
// @route   POST /api/holidays
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { day, month, year, reason, semester } = req.body;

    if (!day || !month || !year || !semester) {
      return res.status(400).json({
        success: false,
        error: 'Day, month, year, and semester are required'
      });
    }
    
    const academicPeriod = await AcademicPeriod.findOne({
      userId: req.user.id,
      semester: semester
    });
    
    if (!academicPeriod) {
      return res.status(404).json({
        success: false,
        error: 'Academic period not found for this semester'
      });
    }
    
    const holiday = await Holiday.create({
      academicPeriodId: academicPeriod._id,
      userId: req.user.id,
      date: new Date(parseInt(year), parseInt(month) - 1, parseInt(day)),
      reason: reason || ''
    });

    res.status(200).json({
      success: true,
      data: holiday
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Holiday already exists for this date'
      });
    }
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete holiday
// @route   DELETE /api/holidays/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const holiday = await Holiday.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!holiday) {
      return res.status(404).json({
        success: false,
        error: 'Holiday not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Holiday deleted'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
