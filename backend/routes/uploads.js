const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { parseSchedulePDF } = require('../utils/pdfParser');
const Subject = require('../models/Subject');
const { protect } = require('../middleware/auth');

// Set up storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store uploads in user-specific directory
    const userUploadsDir = path.join('uploads', req.user.id.toString());
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(userUploadsDir)) {
      fs.mkdirSync(userUploadsDir, { recursive: true });
    }
    
    cb(null, userUploadsDir);
  },
  filename: (req, file, cb) => {
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

// @desc    Upload schedule PDF
// @route   POST /api/uploads/schedule
// @access  Private
router.post('/schedule', protect, upload.single('schedule'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a PDF file'
      });
    }

    // Parse the schedule PDF
    const scheduleItems = await parseSchedulePDF(req.file.path);

    if (scheduleItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Could not extract schedule information from PDF'
      });
    }

    // Store the upload information in the user-specific database
    await req.userDb.models.UserInfo.findOneAndUpdate(
      { mainUserId: req.user._id },
      { 
        $set: { 
          'uploads.schedule': {
            filePath: req.file.path,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            uploadDate: new Date(),
            size: req.file.size
          }
        } 
      },
      { new: true }
    );

    // Return the extracted schedule information
    res.status(200).json({
      success: true,
      data: scheduleItems
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Error uploading or parsing file'
    });
  }
});

// @desc    Upload profile picture
// @route   POST /api/uploads/profile
// @access  Private
router.post('/profile', protect, upload.single('profile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload an image file'
      });
    }

    // Store the profile picture information in the user-specific database
    await req.userDb.models.UserInfo.findOneAndUpdate(
      { mainUserId: req.user._id },
      { 
        $set: { 
          'profilePicture': {
            filePath: req.file.path,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            uploadDate: new Date(),
            size: req.file.size
          }
        } 
      },
      { new: true }
    );

    // Return the file path
    res.status(200).json({
      success: true,
      data: {
        filename: req.file.filename
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Error uploading file'
    });
  }
});

module.exports = router; 