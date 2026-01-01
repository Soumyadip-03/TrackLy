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
    const { date, name, description } = req.body;

    const user = await req.userDb.models.User.findById(req.user.id);
    
    user.holidays.push({
      date: new Date(date),
      name: name || 'Holiday',
      description: description || ''
    });
    
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

// @desc    Delete holiday
// @route   DELETE /api/holidays/:date
// @access  Private
router.delete('/:date', protect, async (req, res) => {
  try {
    const user = await req.userDb.models.User.findById(req.user.id);
    
    user.holidays = user.holidays.filter(
      h => h.date.toISOString().split('T')[0] !== req.params.date
    );
    
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
