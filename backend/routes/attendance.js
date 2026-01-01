const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Mark attendance (whole day)
// @route   POST /api/attendance/whole-day
// @access  Private
router.post(
  '/whole-day',
  protect,
  [
    body('date', 'Date is required').not().isEmpty(),
    body('status', 'Status is required').isIn(['present', 'absent'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { date, status } = req.body;
      const userId = req.user.id;

      // Get all subjects for this user
      const subjects = await Subject.find({ user: userId });

      if (subjects.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No subjects found for this user'
        });
      }

      // Format date to remove time portion
      const formattedDate = new Date(date);
      formattedDate.setHours(0, 0, 0, 0);

      // Get day of week
      const dayOfWeek = [
        'Sunday', 'Monday', 'Tuesday', 'Wednesday',
        'Thursday', 'Friday', 'Saturday'
      ][formattedDate.getDay()];

      // Filter subjects that have classes on this day
      const subjectsOnDay = subjects.filter(subject => 
        subject.schedule.some(schedule => schedule.day === dayOfWeek)
      );

      if (subjectsOnDay.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No classes scheduled for this day'
        });
      }

      // For each subject, create or update attendance record
      const attendanceRecords = [];
      let points = 0;

      for (const subject of subjectsOnDay) {
        // Check if attendance record already exists
        let attendance = await Attendance.findOne({
          user: userId,
          subject: subject._id,
          date: formattedDate
        });

        if (attendance) {
          // Update existing record
          attendance.status = status;
          attendance.calculationType = 'wholeDay';
          await attendance.save();
        } else {
          // Create new record
          attendance = await Attendance.create({
            user: userId,
            subject: subject._id,
            date: formattedDate,
            status,
            calculationType: 'wholeDay'
          });
        }

        attendanceRecords.push(attendance);

        // Update subject totals
        if (status === 'present') {
          subject.attendedClasses += 1;
        }
        
        subject.totalClasses += 1;
        const attendancePercentage = subject.getAttendancePercentage();
        await subject.save();

        // Check for low attendance warning - use user's threshold setting
        const user = await User.findById(userId);
        const attendanceSettings = user.notificationPreferences?.attendanceReminders !== false;
        const threshold = parseInt(user.notificationPreferences?.attendanceThreshold || '75');
        
        if (attendanceSettings && attendancePercentage < threshold && attendancePercentage > 0) {
          await createNotification({
            userId,
            title: 'Low Attendance Warning',
            message: `Your attendance in ${subject.name} is ${attendancePercentage.toFixed(1)}%. Attend more classes to maintain ${threshold}% attendance.`,
            type: 'alert',
            category: 'attendance',
            priority: 'high'
          });
        }

        // For absent records, we'll deduct points
        if (status === 'absent') {
          points += 2; // Deduct 2 points per absent
        }
      }

      // If there are points to deduct, update user
      if (points > 0 && status === 'absent') {
        const user = await User.findById(userId);
        user.points = Math.max(0, user.points - points);
        await user.save();

        // Create notification for point deduction
        await createNotification({
          userId,
          title: 'Points Deducted',
          message: `You've lost ${points} points for marking absence on ${new Date(date).toLocaleDateString()}.`,
          type: 'alert',
          category: 'points',
          priority: 'medium'
        });
      }

      res.status(201).json({
        success: true,
        data: attendanceRecords,
        pointsDeducted: status === 'absent' ? points : 0
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  }
);

// @desc    Mark attendance (per subject)
// @route   POST /api/attendance/per-subject
// @access  Private
router.post(
  '/per-subject',
  protect,
  [
    body('date', 'Date is required').not().isEmpty(),
    body('subjectId', 'Subject ID is required').not().isEmpty(),
    body('status', 'Status is required').isIn(['present', 'absent'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { date, subjectId, status } = req.body;
      const userId = req.user.id;

      // Check if subject exists and belongs to user
      const subject = await Subject.findOne({ _id: subjectId, user: userId });

      if (!subject) {
        return res.status(404).json({
          success: false,
          error: 'Subject not found'
        });
      }

      // Format date to remove time portion
      const formattedDate = new Date(date);
      formattedDate.setHours(0, 0, 0, 0);

      // Check if attendance record already exists
      let attendance = await Attendance.findOne({
        user: userId,
        subject: subjectId,
        date: formattedDate
      });

      if (attendance) {
        // Update existing record
        attendance.status = status;
        attendance.calculationType = 'perSubject';
        await attendance.save();
      } else {
        // Create new record
        attendance = await Attendance.create({
          user: userId,
          subject: subjectId,
          date: formattedDate,
          status,
          calculationType: 'perSubject'
        });
      }

      // Update subject totals
      if (status === 'present') {
        subject.attendedClasses += 1;
      }
      
      subject.totalClasses += 1;
      const attendancePercentage = subject.getAttendancePercentage();
      await subject.save();

      // Check for low attendance warning - use user's threshold setting
      const user = await User.findById(userId);
      const attendanceSettings = user.notificationPreferences?.attendanceReminders !== false;
      const threshold = parseInt(user.notificationPreferences?.attendanceThreshold || '75');
      
      if (attendanceSettings && attendancePercentage < threshold && attendancePercentage > 0) {
        await createNotification({
          userId,
          title: 'Low Attendance Warning',
          message: `Your attendance in ${subject.name} is ${attendancePercentage.toFixed(1)}%. Attend more classes to maintain ${threshold}% attendance.`,
          type: 'alert',
          category: 'attendance',
          priority: 'high'
        });
      }

      // Deduct points for using per-subject calculator (2 points per use)
      user.points = Math.max(0, user.points - 2);
      await user.save();

      // Create notification for point deduction
      await createNotification({
        userId,
        title: 'Points Deducted',
        message: `You've lost 2 points for using the Per Subject Calculator for ${subject.name}.`,
        type: 'alert',
        category: 'points',
        priority: 'low'
      });

      res.status(201).json({
        success: true,
        data: attendance,
        pointsDeducted: 2
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  }
);

// @desc    Get attendance statistics
// @route   GET /api/attendance/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all subjects
    const subjects = await Subject.find({ user: userId });
    
    // Calculate overall attendance percentage
    let totalClasses = 0;
    let totalAttended = 0;

    const subjectStats = subjects.map(subject => {
      const percentage = subject.getAttendancePercentage();
      
      totalClasses += subject.totalClasses;
      totalAttended += subject.attendedClasses;
      
      return {
        _id: subject._id,
        name: subject.name,
        code: subject.code,
        percentage,
        attendedClasses: subject.attendedClasses,
        totalClasses: subject.totalClasses,
        semester: subject.semester
      };
    });

    // Overall percentage
    const overallPercentage = totalClasses === 0 
      ? 0 
      : Math.round((totalAttended / totalClasses) * 100);

    // Get user's points
    const user = await User.findById(userId);
    
    res.status(200).json({
      success: true,
      data: {
        overall: {
          percentage: overallPercentage,
          attendedClasses: totalAttended,
          totalClasses
        },
        subjects: subjectStats,
        points: user.points
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get attendance history
// @route   GET /api/attendance/history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get attendance records with subject details
    const history = await Attendance.find({ user: userId })
      .populate('subject', 'name code')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get attendance by date range
// @route   GET /api/attendance/range
// @access  Private
router.get('/range', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Please provide start and end dates'
      });
    }

    // Format dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Get attendance within date range
    const history = await Attendance.find({
      user: userId,
      date: { $gte: start, $lte: end }
    })
      .populate('subject', 'name code')
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get all attendance records (schedule-based)
// @route   GET /api/attendance/records
// @access  Private
router.get('/records', protect, async (req, res) => {
  try {
    const userInfo = await req.userDb.models.UserInfo.findOne({ mainUserId: req.user.id });
    
    res.status(200).json({
      success: true,
      data: userInfo?.attendanceRecords || []
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Save attendance records (schedule-based)
// @route   POST /api/attendance/records
// @access  Private
router.post('/records', protect, async (req, res) => {
  try {
    const { records } = req.body;

    const userInfo = await req.userDb.models.UserInfo.findOneAndUpdate(
      { mainUserId: req.user.id },
      { 
        $set: { 
          attendanceRecords: records || []
        }
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      data: userInfo.attendanceRecords
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