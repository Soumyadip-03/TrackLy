const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Upload = require('../models/Upload');
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

// Filter for image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit for images
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

    // Store the profile picture information
    await Upload.create({
      userId: req.user._id,
      type: 'profile',
      filePath: req.file.path,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });

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