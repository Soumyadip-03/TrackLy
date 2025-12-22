const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { updateUserInfo } = require('../middleware/userDb');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userUploadsDir = path.join('uploads', 'schedules', req.user.id.toString());
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(userUploadsDir)) {
      fs.mkdirSync(userUploadsDir, { recursive: true });
    }
    
    cb(null, userUploadsDir);
  },
  filename: (req, file, cb) => {
    // Use timestamp + original filename to ensure uniqueness
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Filter for PDF files
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
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

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
      
      // Build user object
      const userFields = {};
      if (name) userFields.name = name;
      if (currentSemester) userFields.currentSemester = currentSemester;
      if (profilePicture) userFields.profilePicture = profilePicture;

      // Update user
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: userFields },
        { new: true }
      );

      // Also update user info in the user-specific database
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

      // Get file information
      const { filename, originalname, path: filePath, size } = req.file;

      // Update user with PDF schedule information
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

      // Store schedule information in user-specific database
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

    // Check if file exists
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
    // Get schedule info from user-specific database
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

    // Check if file exists
    if (!fs.existsSync(userInfo.pdfSchedule.path)) {
      return res.status(404).json({
        success: false,
        error: 'PDF file not found'
      });
    }

    // Send the file
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

    // Get current user
    const user = await User.findById(req.user.id);

    // Update points based on operation (add or subtract)
    if (operation === 'add') {
      user.points += points;
    } else if (operation === 'subtract') {
      user.points -= points;
      // Make sure points don't go below 0
      if (user.points < 0) user.points = 0;
    }

    await user.save();

    // Update points in user-specific database
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
    // Get schedule info from user-specific database
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

    // Save the filepath to delete the actual file
    const filePath = userInfo.pdfSchedule.path;

    // Update user to remove pdfSchedule from main database
    await User.findByIdAndUpdate(
      req.user.id,
      { $unset: { pdfSchedule: "" } }
    );

    // Update user-specific database to remove pdfSchedule
    await req.userDb.models.UserInfo.findOneAndUpdate(
      { mainUserId: req.user._id },
      { $unset: { pdfSchedule: "" } }
    );

    // Try to delete the actual file if it exists
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
    
    // Get schedule info from user-specific database
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

    // Check if file exists
    if (!fs.existsSync(userInfo.pdfSchedule.path)) {
      console.error(`PDF file not found at path: ${userInfo.pdfSchedule.path}`);
      return res.status(404).json({
        success: false,
        error: 'PDF file not found'
      });
    }

    try {
      console.log(`Starting PDF parsing for file: ${userInfo.pdfSchedule.path}`);
      // Parse the schedule PDF
      const { parseSchedulePDF } = require('../utils/pdfParser');
      const scheduleItems = await parseSchedulePDF(userInfo.pdfSchedule.path);

      // Mark the PDF as processed in user-specific database
      await req.userDb.models.UserInfo.findOneAndUpdate(
        { mainUserId: req.user._id },
        { 'pdfSchedule.processed': true }
      );

      // Also mark the PDF as processed in main database
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
      // Return the extracted schedule information
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

      // Get file information
      const { path: filePath } = req.file;
      console.log(`Test PDF uploaded to: ${filePath}`);

      try {
        // Parse the file directly
        const { parseSchedulePDF } = require('../utils/pdfParser');
        const scheduleItems = await parseSchedulePDF(filePath);
        
        // Clean up the temp file
        try {
          fs.unlinkSync(filePath);
          console.log('Test PDF file removed after parsing');
        } catch (cleanupError) {
          console.error('Error cleaning up test file:', cleanupError);
        }
        
        // Return results
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
        // Clean up the temp file even if parsing failed
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

module.exports = router; 