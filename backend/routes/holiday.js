const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// @desc    Get user's holidays
// @route   GET /api/holidays
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await req.userDb.models.User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user?.holidays || []
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

    const user = await req.userDb.models.User.findById(req.user.id);
    
    // Check if holiday already exists for this date and semester
    const existingHoliday = user.holidays.find(h => 
      h.day === day && h.month === month && h.year === year && h.semester === semester
    );
    
    if (existingHoliday) {
      return res.status(400).json({
        success: false,
        error: 'Holiday already exists for this date'
      });
    }
    
    const holidayData = {
      id: new Date().getTime().toString(),
      day: parseInt(day),
      month: parseInt(month),
      year: parseInt(year),
      reason: reason || '',
      semester: semester,
      createdAt: new Date()
    };
    
    user.holidays.push(holidayData);
    await user.save();

    res.status(200).json({
      success: true,
      data: user.holidays.filter(h => h.semester === semester)
    });
  } catch (err) {
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
    const user = await req.userDb.models.User.findById(req.user.id);
    
    const holidayIndex = user.holidays.findIndex(h => h.id === req.params.id);
    
    if (holidayIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Holiday not found'
      });
    }
    
    user.holidays.splice(holidayIndex, 1);
    await user.save();

    res.status(200).json({
      success: true,
      data: user.holidays
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
