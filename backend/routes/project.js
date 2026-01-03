const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// @desc    Get project info
// @route   GET /api/project/info
// @access  Private
router.get('/info', protect, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        name: 'TrackLy',
        version: '1.0.0',
        description: 'Student Attendance Tracking System'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router; 