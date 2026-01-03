const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Schedule = require('../models/Schedule');
const AcademicPeriod = require('../models/AcademicPeriod');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

// @desc    Get user's schedule for current academic period
// @route   GET /api/schedule
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const academicPeriod = await AcademicPeriod.findOne({ 
      userId: req.user.id, 
      semester: String(user.currentSemester)
    });

    let schedule;
    if (academicPeriod) {
      schedule = await Schedule.findOne({ 
        userId: req.user.id, 
        academicPeriodId: academicPeriod._id 
      }).sort({ createdAt: -1 });
    } else {
      schedule = await Schedule.findOne({ 
        userId: req.user.id,
        userSemester: user.currentSemester
      }).sort({ createdAt: -1 });
    }
    
    res.status(200).json({
      success: true,
      data: schedule?.schedule || { classes: [] }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Save/Update user's schedule for current academic period
// @route   POST /api/schedule
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { classes, offDays } = req.body;
    console.log('Received schedule save request:', { classesCount: classes?.length, offDaysCount: offDays?.length });
    
    const user = await User.findById(req.user.id);
    
    const academicPeriod = await AcademicPeriod.findOne({ 
      userId: req.user.id, 
      semester: String(user.currentSemester)
    });

    if (!academicPeriod) {
      console.log('No academic period found, creating schedule without academic period');
      
      let schedule = await Schedule.findOne({
        userId: req.user.id,
        userSemester: user.currentSemester
      });

      if (schedule) {
        schedule.schedule = { classes: classes || [], offDays: offDays || [] };
        await schedule.save();
      } else {
        schedule = await Schedule.create({
          userId: req.user.id,
          academicPeriodId: null,
          userName: user.name,
          userSemester: user.currentSemester,
          scheduleId: uuidv4(),
          schedule: { classes: classes || [], offDays: offDays || [] }
        });
      }

      console.log('Schedule saved successfully without academic period');
      return res.status(200).json({
        success: true,
        data: schedule.schedule
      });
    }

    let schedule = await Schedule.findOne({
      userId: req.user.id,
      academicPeriodId: academicPeriod._id
    });

    if (schedule) {
      console.log('Updating existing schedule');
      schedule.schedule = { classes: classes || [], offDays: offDays || [] };
      await schedule.save();
    } else {
      console.log('Creating new schedule');
      schedule = await Schedule.create({
        userId: req.user.id,
        academicPeriodId: academicPeriod._id,
        userName: user.name,
        userSemester: user.currentSemester,
        scheduleId: uuidv4(),
        schedule: { classes: classes || [], offDays: offDays || [] }
      });
    }

    console.log('Schedule saved successfully');
    res.status(200).json({
      success: true,
      data: schedule.schedule
    });
  } catch (err) {
    console.error('Schedule save error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Clear user's schedule and subjects for current academic period
// @route   DELETE /api/schedule
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const academicPeriod = await AcademicPeriod.findOne({ 
      userId: req.user.id, 
      semester: user.currentSemester 
    });

    if (academicPeriod) {
      const Subject = require('../models/Subject');
      
      await Schedule.deleteMany({ 
        userId: req.user.id, 
        academicPeriodId: academicPeriod._id 
      });
      
      await Subject.deleteMany({ 
        user: req.user.id, 
        academicPeriodId: academicPeriod._id 
      });
    }

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
