const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const Schedule = require('../models/Schedule');
const AcademicPeriod = require('../models/AcademicPeriod');
const Holiday = require('../models/Holiday');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Toggle auto-attendance
// @route   PUT /api/auto-attendance/toggle
// @access  Private
router.put('/toggle', protect, async (req, res) => {
  try {
    const { enabled } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    user.autoAttendanceEnabled = enabled;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        autoAttendanceEnabled: user.autoAttendanceEnabled
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

// @desc    Get auto-attendance status
// @route   GET /api/auto-attendance/status
// @access  Private
router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        autoAttendanceEnabled: user.autoAttendanceEnabled || false
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

// @desc    Mark past classes when auto-attendance is turned ON
// @route   POST /api/auto-attendance/mark-past
// @access  Private
router.post('/mark-past', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    console.log('🔵 [AUTO-ATTENDANCE] Starting mark-past for user:', userId);

    // Get user's schedule
    const schedule = await Schedule.findOne({
      userId: userId,
      userSemester: user.currentSemester
    }).sort({ createdAt: -1 });

    if (!schedule || !schedule.schedule.classes.length) {
      console.log('⚠️ [AUTO-ATTENDANCE] No schedule found');
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No schedule found'
      });
    }

    console.log('✅ [AUTO-ATTENDANCE] Schedule found with', schedule.schedule.classes.length, 'classes');

    // Get academic period to find start date and check if active
    let startDate;
    let academicPeriod = null;
    
    if (schedule.academicPeriodId) {
      academicPeriod = await AcademicPeriod.findById(schedule.academicPeriodId);
      
      if (academicPeriod) {
        // Check if academic period has ended
        const now = new Date();
        const endDate = new Date(academicPeriod.endDate);
        
        if (now > endDate) {
          console.log('⛔ [AUTO-ATTENDANCE] Academic period ended on', endDate.toISOString().split('T')[0]);
          return res.status(200).json({
            success: true,
            data: [],
            message: 'Academic period has ended. Schedule is no longer active.'
          });
        }
        
        // Convert UTC to local date (start of day)
        const utcDate = new Date(academicPeriod.startDate);
        startDate = new Date(utcDate.getFullYear(), utcDate.getMonth(), utcDate.getDate());
        console.log('📅 [AUTO-ATTENDANCE] Using academic period start date:', startDate.toISOString().split('T')[0]);
      } else {
        startDate = new Date(schedule.createdAt);
        console.log('📅 [AUTO-ATTENDANCE] Academic period not found, using schedule creation date:', startDate.toISOString().split('T')[0]);
      }
    } else {
      startDate = new Date(schedule.createdAt);
      console.log('📅 [AUTO-ATTENDANCE] Using schedule creation date:', startDate.toISOString().split('T')[0]);
    }

    // Get all holidays to exclude them
    const holidays = await Holiday.find({ userId });
    const holidayDates = new Set(holidays.map(h => new Date(h.date).toISOString().split('T')[0]));
    console.log('🏖️ [AUTO-ATTENDANCE] Found', holidays.length, 'holidays');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const markedRecords = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    console.log('🔄 [AUTO-ATTENDANCE] Iterating from', startDate.toISOString().split('T')[0], 'to', today.toISOString().split('T')[0]);

    // Iterate through all dates from start date to today
    const currentDate = new Date(startDate);
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Skip holidays
      if (holidayDates.has(dateStr)) {
        console.log('⏭️ [AUTO-ATTENDANCE] Skipping holiday:', dateStr);
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }
      
      // Skip off days from schedule
      const dayName = dayNames[currentDate.getDay()];
      if (schedule.schedule.offDays && schedule.schedule.offDays.includes(dayName)) {
        console.log('⏭️ [AUTO-ATTENDANCE] Skipping off day:', dateStr, dayName);
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const isToday = dateStr === today.toISOString().split('T')[0];

      // Get classes for this day
      for (const cls of schedule.schedule.classes) {
        if (cls.day !== dayName) continue;

        // For today, only mark classes that have ended
        if (isToday) {
          const [endHour, endMin] = cls.endTime.split(':').map(Number);
          const classEndTime = endHour * 60 + endMin;
          if (classEndTime >= currentTime) {
            console.log('⏭️ [AUTO-ATTENDANCE] Skipping future class:', cls.subject, 'at', cls.endTime);
            continue;
          }
        }

        // Check if attendance already exists
        const existingAttendance = await Attendance.findOne({
          user: userId,
          subject: cls.subjectId,
          date: new Date(currentDate),
          scheduleClassId: cls.id || ''
        });

        if (existingAttendance) {
          console.log('⏭️ [AUTO-ATTENDANCE] Attendance already exists for:', cls.subject, 'on', dateStr);
          continue;
        }

        // Get subject
        let subjectId = cls.subjectId;
        
        // Handle if subjectId is a string representation of ObjectId
        if (typeof subjectId === 'string' && subjectId.includes('ObjectId')) {
          // Extract the actual ID from string like "new ObjectId('abc123')"
          const match = subjectId.match(/ObjectId\(['"]([^'"]+)['"]\)/);
          if (match) {
            subjectId = match[1];
          }
        }
        
        const subject = await Subject.findById(subjectId);
        if (!subject) {
          console.log('❌ [AUTO-ATTENDANCE] Subject not found:', cls.subjectId, '(cleaned:', subjectId, ')');
          continue;
        }

        // Create attendance record
        const attendance = await Attendance.create({
          user: userId,
          subject: cls.subjectId,
          subjectName: subject.name,
          date: new Date(currentDate),
          status: 'present',
          calculationType: 'perSubject',
          classType: cls.classType || 'none',
          scheduleClassId: cls.id || '',
          isAutoMarked: true,
          hasPreparatoryTag: false,
          timeDuration: {
            startTime: cls.startTime || '',
            endTime: cls.endTime || ''
          }
        });

        console.log('✅ [AUTO-ATTENDANCE] Created attendance:', subject.name, 'on', dateStr);

        // Update subject counters
        subject.attendedClasses += 1;
        subject.totalClasses += 1;
        if (cls.classType && subject.classTypeStats[cls.classType]) {
          subject.classTypeStats[cls.classType].attended += 1;
          subject.classTypeStats[cls.classType].total += 1;
        }
        await subject.save();

        markedRecords.push(attendance);
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('🎉 [AUTO-ATTENDANCE] Completed! Marked', markedRecords.length, 'records');

    // Create detailed notification with attendance info
    if (markedRecords.length > 0) {
      // Format dates properly for display
      const startDateFormatted = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      const todayFormatted = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      
      // Simple summary message to stay under 500 chars
      const message = `Auto-marked ${markedRecords.length} past class${markedRecords.length > 1 ? 'es' : ''} as present from ${startDateFormatted} to ${todayFormatted}.\n\nCheck your attendance history for details.`;
      
      await createNotification({
        userId,
        title: 'Past Classes Auto-Marked',
        message: message,
        type: 'info',
        category: 'attendance',
        priority: 'medium'
      });
    }

    res.status(200).json({
      success: true,
      data: markedRecords,
      count: markedRecords.length
    });
  } catch (err) {
    console.error('❌ [AUTO-ATTENDANCE] Error:', err.message);
    console.error(err.stack);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Bulk upload auto-attendance (end of day)
// @route   POST /api/auto-attendance/bulk-upload
// @access  Private
router.post('/bulk-upload', protect, async (req, res) => {
  try {
    const { attendanceRecords } = req.body;
    const userId = req.user.id;

    if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid attendance records'
      });
    }

    const uploadedRecords = [];
    const notificationData = [];

    for (const record of attendanceRecords) {
      const { subjectId, date, status, classType, scheduleClassId, hasPreparatoryTag, startTime, endTime } = record;

      // Check if already exists
      const existingAttendance = await Attendance.findOne({
        user: userId,
        subject: subjectId,
        date: new Date(date),
        scheduleClassId: scheduleClassId || ''
      });

      if (existingAttendance) continue;

      // Get subject
      const subject = await Subject.findById(subjectId);
      if (!subject) continue;

      // Create attendance
      const attendance = await Attendance.create({
        user: userId,
        subject: subjectId,
        subjectName: subject.name,
        date: new Date(date),
        status,
        calculationType: 'perSubject',
        classType: classType || 'none',
        scheduleClassId: scheduleClassId || '',
        isAutoMarked: true,
        hasPreparatoryTag: hasPreparatoryTag || false,
        timeDuration: {
          startTime: startTime || '',
          endTime: endTime || ''
        }
      });

      // Update counters
      if (hasPreparatoryTag) {
        const prepSubject = await Subject.findOne({
          user: userId,
          name: 'Preparatory',
          classType: 'preparatory'
        });
        if (prepSubject) {
          if (status === 'present') prepSubject.attendedClasses += 1;
          prepSubject.totalClasses += 1;
          await prepSubject.save();
        }
      } else {
        if (status === 'present') {
          subject.attendedClasses += 1;
          if (classType && subject.classTypeStats[classType]) {
            subject.classTypeStats[classType].attended += 1;
          }
        }
        subject.totalClasses += 1;
        if (classType && subject.classTypeStats[classType]) {
          subject.classTypeStats[classType].total += 1;
        }
        await subject.save();
      }

      uploadedRecords.push(attendance);
      notificationData.push({
        subject: subject.name,
        classType: classType || 'none',
        time: `${startTime} - ${endTime}`,
        date: new Date(date).toISOString().split('T')[0],
        status
      });
    }

    // Create single notification
    if (notificationData.length > 0) {
      let message = `End of day: Auto-uploaded ${notificationData.length} attendance record${notificationData.length > 1 ? 's' : ''}:\n\n`;
      
      const groupedByDate = notificationData.reduce((acc, data) => {
        if (!acc[data.date]) acc[data.date] = [];
        acc[data.date].push(data);
        return acc;
      }, {});

      Object.entries(groupedByDate).forEach(([date, records]) => {
        message += `📅 ${date}\n`;
        records.forEach(data => {
          message += `  📚 ${data.subject} (${data.classType}) - ${data.status}\n  ⏰ ${data.time}\n`;
        });
        message += '\n';
      });

      await createNotification({
        userId,
        title: 'End of Day Auto-Upload Complete',
        message: message.trim(),
        type: 'success',
        category: 'attendance',
        priority: 'medium'
      });
    }

    res.status(200).json({
      success: true,
      data: uploadedRecords,
      count: uploadedRecords.length
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
