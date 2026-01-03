const express = require('express');
const router = express.Router();
const Holiday = require('../models/Holiday');
const AcademicPeriod = require('../models/AcademicPeriod');
const { protect } = require('../middleware/auth');

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
    const holidays = await Holiday.find({ academicPeriodId: academicPeriod._id }).sort({ month: 1, day: 1 });
    
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
    const holidays = await Holiday.find({ userId: req.user.id }).sort({ year: 1, month: 1, day: 1 });
    
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
    
    // Find academic period
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
    
    // Create holiday
    const holiday = await Holiday.create({
      academicPeriodId: academicPeriod._id,
      userId: req.user.id,
      day: parseInt(day),
      month: parseInt(month),
      year: parseInt(year),
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
