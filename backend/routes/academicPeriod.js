const express = require('express');
const router = express.Router();
const AcademicPeriod = require('../models/AcademicPeriod');
const { protect } = require('../middleware/auth');

// Get all academic periods for logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const periods = await AcademicPeriod.find({ userId: req.user.id }).sort({ semester: 1 });
    
    res.status(200).json({
      success: true,
      data: periods
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get academic period by semester
router.get('/:semester', protect, async (req, res) => {
  try {
    const period = await AcademicPeriod.findOne({ 
      userId: req.user.id, 
      semester: req.params.semester 
    });
    
    if (!period) {
      return res.status(404).json({
        success: false,
        error: 'Academic period not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: period
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Create or update academic period
router.post('/', protect, async (req, res) => {
  try {
    const { semester, startDate, endDate } = req.body;
    
    if (!semester || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Please provide semester, startDate, and endDate'
      });
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        error: 'Start date cannot be after end date'
      });
    }
    
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    // Check if academic period already exists for this semester
    let period = await AcademicPeriod.findOne({ 
      userId: req.user.id, 
      semester 
    });
    
    if (period) {
      // Update existing
      period.startDate = startDate;
      period.endDate = endDate;
      await period.save();
    } else {
      // Create new
      period = await AcademicPeriod.create({
        userId: req.user.id,
        userName: user.name,
        semester,
        startDate,
        endDate
      });
    }
    
    res.status(200).json({
      success: true,
      data: period
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Delete academic period
router.delete('/:semester', protect, async (req, res) => {
  try {
    const period = await AcademicPeriod.findOneAndDelete({ 
      userId: req.user.id, 
      semester: req.params.semester 
    });
    
    if (!period) {
      return res.status(404).json({
        success: false,
        error: 'Academic period not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Academic period deleted'
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
