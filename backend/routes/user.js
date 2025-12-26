const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { updateUserInfo } = require('../middleware/userDb');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

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

// @desc    Delete profile picture
// @route   DELETE /api/user/profile-picture
// @access  Private
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

// @desc    Upload profile picture
// @route   POST /api/user/profile-picture
// @access  Private
router.post(
  '/profile-picture',
  protect,
  uploadProfilePicture.single('profilePicture'),
  async (req, res) => {
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
  }
);

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
router.put(
  '/profile',
  protect,
  [
    body('name', 'Name is required').optional().not().isEmpty(),
    body('currentSemester', 'Current semester must be a number').optional().isNumeric()
  ],
  async (req, res) => {
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

      if (name) {
        await updateUserInfo({
          _id: req.user.id,
          name: name,
          email: user.email,
          studentId: user.studentId
        });
      }

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
  }
);

// @desc    Upload and save PDF schedule
// @route   POST /api/user/schedule/pdf
// @access  Private
router.post(
  '/schedule/pdf',
  protect,
  upload.single('pdfSchedule'),
  async (req, res) => {
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

      await req.userDb.models.UserInfo.findOneAndUpdate(
        { mainUserId: req.user._id },
        {
          $set: {
            pdfSchedule: {
              name: filename,
              originalName: originalname,
              path: filePath,
              size: size,
              uploadDate: new Date(),
              processed: false
            }
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
  }
);

// @desc    Get user's PDF schedule
// @route   GET /api/user/schedule/pdf
// @access  Private
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

// @desc    Download user's PDF schedule
// @route   GET /api/user/schedule/pdf/download
// @access  Private
router.get('/schedule/pdf/download', protect, async (req, res) => {
  try {
    const userInfo = await req.userDb.models.UserInfo.findOne(
      { mainUserId: req.user._id },
      { 'pdfSchedule': 1 }
    );

    if (!userInfo || !userInfo.pdfSchedule) {
      return res.status(404).json({
        success: false,
        error: 'No PDF schedule found for this user'
      });
    }

    if (!fs.existsSync(userInfo.pdfSchedule.path)) {
      return res.status(404).json({
        success: false,
        error: 'PDF file not found'
      });
    }

    res.download(userInfo.pdfSchedule.path, userInfo.pdfSchedule.originalName);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update user points
// @route   PUT /api/user/points
// @access  Private
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

    await req.userDb.models.UserInfo.findOneAndUpdate(
      { mainUserId: req.user._id },
      { $set: { points: user.points } },
      { new: true }
    );

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

// @desc    Delete user's PDF schedule
// @route   DELETE /api/user/schedule/pdf
// @access  Private
router.delete('/schedule/pdf', protect, async (req, res) => {
  try {
    const userInfo = await req.userDb.models.UserInfo.findOne(
      { mainUserId: req.user._id },
      { 'pdfSchedule': 1 }
    );

    if (!userInfo || !userInfo.pdfSchedule) {
      return res.status(404).json({
        success: false,
        error: 'No PDF schedule found for this user'
      });
    }

    const filePath = userInfo.pdfSchedule.path;

    await User.findByIdAndUpdate(
      req.user.id,
      { $unset: { pdfSchedule: "" } }
    );

    await req.userDb.models.UserInfo.findOneAndUpdate(
      { mainUserId: req.user._id },
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

// @desc    Parse user's PDF schedule
// @route   GET /api/user/schedule/pdf/parse
// @access  Private
router.get('/schedule/pdf/parse', protect, async (req, res) => {
  try {
    console.log(`Attempting to parse PDF for user ${req.user.id}`);
    
    const userInfo = await req.userDb.models.UserInfo.findOne(
      { mainUserId: req.user._id },
      { 'pdfSchedule': 1 }
    );

    if (!userInfo || !userInfo.pdfSchedule) {
      console.log(`No PDF schedule found for user ${req.user.id}`);
      return res.status(404).json({
        success: false,
        error: 'No PDF schedule found for this user'
      });
    }

    if (!fs.existsSync(userInfo.pdfSchedule.path)) {
      console.error(`PDF file not found at path: ${userInfo.pdfSchedule.path}`);
      return res.status(404).json({
        success: false,
        error: 'PDF file not found'
      });
    }

    try {
      console.log(`Starting PDF parsing for file: ${userInfo.pdfSchedule.path}`);
      const { parseSchedulePDF } = require('../utils/pdfParser');
      const scheduleItems = await parseSchedulePDF(userInfo.pdfSchedule.path);

      await req.userDb.models.UserInfo.findOneAndUpdate(
        { mainUserId: req.user._id },
        { 'pdfSchedule.processed': true }
      );

      await User.findByIdAndUpdate(req.user.id, { 
        'pdfSchedule.processed': true 
      });

      if (!scheduleItems || scheduleItems.length === 0) {
        console.warn(`No schedule items extracted from PDF for user ${req.user.id}`);
        return res.status(400).json({
          success: false,
          error: 'Could not extract schedule information from PDF. The format may not be supported.'
        });
      }

      console.log(`Successfully extracted ${scheduleItems.length} schedule items for user ${req.user.id}`);
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

// @desc    Upload and parse PDF directly (for testing)
// @route   POST /api/user/schedule/pdf/test
// @access  Private
router.post(
  '/schedule/pdf/test',
  protect,
  upload.single('pdfSchedule'),
  async (req, res) => {
    try {
      console.log('Testing PDF parsing with direct upload');
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Please upload a PDF file'
        });
      }

      const { path: filePath } = req.file;
      console.log(`Test PDF uploaded to: ${filePath}`);

      try {
        const { parseSchedulePDF } = require('../utils/pdfParser');
        const scheduleItems = await parseSchedulePDF(filePath);
        
        try {
          fs.unlinkSync(filePath);
          console.log('Test PDF file removed after parsing');
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
          console.log('Test PDF file removed after failed parsing');
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
  }
);

// @desc    Change password
// @route   PUT /api/user/change-password
// @access  Private
router.put(
  '/change-password',
  protect,
  [
    body('currentPassword', 'Current password is required').not().isEmpty(),
    body('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
  ],
  async (req, res) => {
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
      await user.save();

      await req.userDb.models.UserInfo.findOneAndUpdate(
        { mainUserId: req.user.id },
        { 
          $push: { 
            accountActivity: {
              action: 'password_changed',
              timestamp: new Date()
            }
          }
        }
      );

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
  }
);

// @desc    Clear all login sessions
// @route   POST /api/user/clear-sessions
// @access  Private
router.post('/clear-sessions', protect, async (req, res) => {
  try {
    await req.userDb.models.UserInfo.findOneAndUpdate(
      { mainUserId: req.user.id },
      { 
        $set: { loginHistory: [] },
        $push: { 
          accountActivity: {
            action: 'all_sessions_cleared',
            timestamp: new Date()
          }
        }
      }
    );

    res.status(200).json({
      success: true,
      message: 'All login sessions cleared successfully'
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
