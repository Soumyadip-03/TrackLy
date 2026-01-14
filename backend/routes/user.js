const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userUploadsDir = path.join('uploads', 'schedules', req.user.id.toString());
    
    if (!fs.existsSync(userUploadsDir)) {
      fs.mkdirSync(userUploadsDir, { recursive: true });
    }
    
    cb(null, userUploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

// Set up storage for profile pictures
const profilePictureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const profileDir = path.join('uploads', 'profiles');
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }
    cb(null, profileDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const profilePictureFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const uploadProfilePicture = multer({
  storage: profilePictureStorage,
  fileFilter: profilePictureFilter,
  limits: {
    fileSize: 2 * 1024 * 1024
  }
});

router.delete('/profile-picture', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.profilePicture) {
      const filePath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: null },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile picture deleted',
      data: updatedUser
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error deleting profile picture'
    });
  }
});

router.post('/profile-picture', protect, uploadProfilePicture.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload an image file'
      });
    }

    const { filename } = req.file;
    const profilePicturePath = `uploads/profiles/${filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: profilePicturePath },
      { new: true }
    );

    res.status(200).json({
      success: true,
      profilePicture: profilePicturePath,
      data: user
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error uploading profile picture'
    });
  }
});

router.put('/profile', protect, [
  body('name', 'Name is required').optional().not().isEmpty(),
  body('currentSemester', 'Current semester must be a number').optional().isNumeric()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, currentSemester, profilePicture } = req.body;
    
    const userFields = {};
    if (name) userFields.name = name;
    if (currentSemester) userFields.currentSemester = currentSemester;
    if (profilePicture) userFields.profilePicture = profilePicture;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: userFields },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Update notification preferences
router.put('/notification-preferences', protect, async (req, res) => {
  try {
    const { 
      attendanceReminders, 
      attendanceThreshold, 
      attendanceReminderFrequency,
      todoReminders,
      todoReminderTime,
      priorityTodosOnly,
      calendarReminders,
      calendarReminderTime
    } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user.notificationPreferences) {
      user.notificationPreferences = {};
    }
    
    if (attendanceReminders !== undefined) {
      user.notificationPreferences.attendanceReminders = attendanceReminders;
    }
    if (attendanceThreshold !== undefined) {
      user.notificationPreferences.attendanceThreshold = attendanceThreshold;
    }
    if (attendanceReminderFrequency !== undefined) {
      user.notificationPreferences.attendanceReminderFrequency = attendanceReminderFrequency;
    }
    if (todoReminders !== undefined) {
      user.notificationPreferences.todoReminders = todoReminders;
    }
    if (todoReminderTime !== undefined) {
      user.notificationPreferences.todoReminderTime = todoReminderTime;
    }
    if (priorityTodosOnly !== undefined) {
      user.notificationPreferences.priorityTodosOnly = priorityTodosOnly;
    }
    if (calendarReminders !== undefined) {
      user.notificationPreferences.calendarReminders = calendarReminders;
    }
    if (calendarReminderTime !== undefined) {
      user.notificationPreferences.calendarReminderTime = calendarReminderTime;
    }
    
    await user.save();

    res.status(200).json({
      success: true,
      data: user.notificationPreferences
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Update email notification preferences
router.put('/email-preferences', protect, async (req, res) => {
  try {
    const { emailNotifications, emailDigest, pointsNotifications, achievementNotifications } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user.notificationPreferences) {
      user.notificationPreferences = {};
    }
    if (!user.notificationPreferences.emailNotifications) {
      user.notificationPreferences.emailNotifications = {};
    }
    
    if (emailNotifications !== undefined) {
      user.notificationPreferences.emailNotifications.enabled = emailNotifications;
    }
    if (emailDigest !== undefined) {
      user.notificationPreferences.emailNotifications.frequency = emailDigest;
    }
    
    const mutedTypes = [];
    if (pointsNotifications === false) mutedTypes.push('points');
    if (achievementNotifications === false) mutedTypes.push('achievement');
    user.notificationPreferences.emailNotifications.mutedTypes = mutedTypes;
    
    await user.save();

    res.status(200).json({
      success: true,
      data: user.notificationPreferences
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

router.post('/schedule/pdf', protect, upload.single('pdfSchedule'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a PDF file'
      });
    }

    const { filename, originalname, path: filePath, size } = req.file;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        pdfSchedule: {
          name: filename,
          originalName: originalname,
          path: filePath,
          size: size,
          uploadDate: new Date(),
          processed: false
        }
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: {
        name: filename,
        originalName: originalname,
        size: size,
        uploadDate: user.pdfSchedule.uploadDate
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error uploading schedule PDF'
    });
  }
});

router.get('/schedule/pdf', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || !user.pdfSchedule) {
      return res.status(404).json({
        success: false,
        error: 'No PDF schedule found for this user'
      });
    }

    if (!fs.existsSync(user.pdfSchedule.path)) {
      return res.status(404).json({
        success: false,
        error: 'PDF file not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        name: user.pdfSchedule.name,
        originalName: user.pdfSchedule.originalName,
        size: user.pdfSchedule.size,
        uploadDate: user.pdfSchedule.uploadDate,
        processed: user.pdfSchedule.processed
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

router.get('/schedule/pdf/download', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || !user.pdfSchedule) {
      return res.status(404).json({
        success: false,
        error: 'No PDF schedule found for this user'
      });
    }

    if (!fs.existsSync(user.pdfSchedule.path)) {
      return res.status(404).json({
        success: false,
        error: 'PDF file not found'
      });
    }

    res.download(user.pdfSchedule.path, user.pdfSchedule.originalName);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

router.put('/points', protect, async (req, res) => {
  try {
    const { points, operation } = req.body;

    const user = await User.findById(req.user.id);

    if (operation === 'add') {
      user.points += points;
    } else if (operation === 'subtract') {
      user.points -= points;
      if (user.points < 0) user.points = 0;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: user.points
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

router.delete('/schedule/pdf', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || !user.pdfSchedule) {
      return res.status(404).json({
        success: false,
        error: 'No PDF schedule found for this user'
      });
    }

    const filePath = user.pdfSchedule.path;

    await User.findByIdAndUpdate(
      req.user.id,
      { $unset: { pdfSchedule: "" } }
    );

    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error deleting file at ${filePath}:`, err);
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Schedule PDF has been removed'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

router.get('/schedule/pdf/parse', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || !user.pdfSchedule) {
      return res.status(404).json({
        success: false,
        error: 'No PDF schedule found for this user'
      });
    }

    if (!fs.existsSync(user.pdfSchedule.path)) {
      return res.status(404).json({
        success: false,
        error: 'PDF file not found'
      });
    }

    try {
      const { parseSchedulePDF } = require('../utils/pdfParser');
      const scheduleItems = await parseSchedulePDF(user.pdfSchedule.path);

      await User.findByIdAndUpdate(req.user.id, { 
        'pdfSchedule.processed': true 
      });

      if (!scheduleItems || scheduleItems.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Could not extract schedule information from PDF. The format may not be supported.'
        });
      }

      res.status(200).json({
        success: true,
        data: scheduleItems
      });
    } catch (parseError) {
      console.error('Error parsing PDF:', parseError);
      return res.status(500).json({
        success: false,
        error: parseError.message || 'Error parsing PDF file'
      });
    }
  } catch (err) {
    console.error('Server error in PDF parsing route:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

router.post('/schedule/pdf/test', protect, upload.single('pdfSchedule'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a PDF file'
      });
    }

    const { path: filePath } = req.file;

    try {
      const { parseSchedulePDF } = require('../utils/pdfParser');
      const scheduleItems = await parseSchedulePDF(filePath);
      
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error('Error cleaning up test file:', cleanupError);
      }
      
      if (!scheduleItems || scheduleItems.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No schedule information could be extracted from the PDF'
        });
      }
      
      res.status(200).json({
        success: true,
        data: scheduleItems,
        message: `Successfully extracted ${scheduleItems.length} schedule items`
      });
    } catch (parseError) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error('Error cleaning up test file:', cleanupError);
      }
      
      console.error('Error testing PDF parsing:', parseError);
      return res.status(500).json({
        success: false,
        error: parseError.message || 'Error parsing the test PDF file'
      });
    }
  } catch (err) {
    console.error('Server error during test PDF parsing:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

router.post('/verify-password', protect, [
  body('password', 'Password is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { password } = req.body;
    
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const isMatch = await user.matchPassword(password);

    res.status(200).json({
      success: true,
      valid: isMatch
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

router.put('/change-password', protect, [
  body('currentPassword', 'Current password is required').not().isEmpty(),
  body('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    user.accountActivity.push({
      action: 'password_changed',
      timestamp: new Date()
    });
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
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
