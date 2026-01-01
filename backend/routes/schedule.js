const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// @desc    Get user's schedule
// @route   GET /api/schedule
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const userInfo = await req.userDb.models.UserInfo.findOne({ mainUserId: req.user.id });
    
    res.status(200).json({
      success: true,
      data: userInfo?.schedule || { classes: [] }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Save/Update user's schedule
// @route   POST /api/schedule
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { classes, offDays } = req.body;

    const userInfo = await req.userDb.models.UserInfo.findOneAndUpdate(
      { mainUserId: req.user.id },
      { 
        $set: { 
          schedule: { classes: classes || [], offDays: offDays || [] }
        }
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      data: userInfo.schedule
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Clear user's schedule
// @route   DELETE /api/schedule
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    await req.userDb.models.UserInfo.findOneAndUpdate(
      { mainUserId: req.user.id },
      { 
        $set: { 
          schedule: { classes: [] }
        }
      }
    );

    res.status(200).json({
      success: true,
      data: {}
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
