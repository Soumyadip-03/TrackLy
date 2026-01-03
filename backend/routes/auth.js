const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const AcademicPeriod = require('../models/AcademicPeriod');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { setupUserDatabase, initializeUserDatabase } = require('../utils/dbManager');
const emailService = require('../utils/emailService');
const sendWelcomeEmail = require('../utils/sendWelcomeEmail');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post(
  '/register',
  [
    body('name', 'Name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    body('studentId', 'Student ID is required').not().isEmpty(),
    body('currentSemester', 'Current semester is required').isNumeric()
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, studentId, currentSemester } = req.body;

    try {
      // Check if user exists
      let user = await User.findOne({ $or: [{ email }, { studentId }] });

      if (user) {
        return res.status(400).json({
          success: false,
          error: 'User already exists with that email or student ID'
        });
      }

      // Create user
      user = new User({
        name,
        email,
        password,
        studentId,
        currentSemester
      });

      await user.save();

      // Track account creation
      const registrationTime = new Date();
      const userAgent = req.headers['user-agent'] || 'Unknown device';
      let ipAddress = req.headers['x-forwarded-for'] || 
                      req.connection.remoteAddress || 
                      req.socket.remoteAddress ||
                      'Unknown IP';
      
      if (ipAddress.includes(',')) {
        ipAddress = ipAddress.split(',')[0].trim();
      }
      
      if (ipAddress === '::1' || ipAddress === '::ffff:127.0.0.1') {
        ipAddress = '127.0.0.1';
      }
      
      const deviceInfo = parseUserAgent(userAgent);
      
      user.loginHistory = [{
        timestamp: registrationTime,
        ipAddress: ipAddress,
        userAgent: userAgent,
        deviceInfo: deviceInfo
      }];
      
      user.accountActivity = [{
        action: 'account_created',
        timestamp: registrationTime,
        details: {
          email: email,
          name: name,
          studentId: studentId,
          currentSemester: currentSemester,
          ipAddress: ipAddress,
          device: deviceInfo.os,
          browser: deviceInfo.browser
        }
      }];

      // Send welcome email
      try {
        const welcomeResult = await sendWelcomeEmail(email, name);
        console.log(`Welcome email to ${email}: ${welcomeResult.success ? 'Sent' : 'Failed'}`);
        
        if (welcomeResult.success) {
          user.emailHistory.push({
            emailType: 'welcome',
            subject: 'Welcome to TrackLy',
            sentAt: new Date(),
            status: 'sent'
          });
        }
      } catch (emailErr) {
        console.error('Error sending welcome email:', emailErr);
      }

      // Send account creation confirmation email
      try {
        const accountConfirmation = {
          title: 'TrackLy Account Created Successfully',
          message: `Hi ${name},<br><br>Your TrackLy account has been successfully created with the following details:<br><br>
          <ul>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Student ID:</strong> ${studentId}</li>
            <li><strong>Current Semester:</strong> ${currentSemester}</li>
            <li><strong>Account Created:</strong> ${new Date().toLocaleString()}</li>
          </ul>
          <br>
          You can now log in to TrackLy and start tracking your attendance. If you have any questions or need assistance, please contact our support team.`
        };
        
        const confirmResult = await emailService.sendEmail(
          email, 
          accountConfirmation.title, 
          accountConfirmation.message
        );
        
        console.log(`Account confirmation email to ${email}: ${confirmResult.success ? 'Sent' : 'Failed'}`);
        
        if (confirmResult.success) {
          user.emailHistory.push({
            emailType: 'confirmation',
            subject: accountConfirmation.title,
            sentAt: new Date(),
            status: 'sent'
          });
        }
      } catch (emailErr) {
        console.error('Error sending account confirmation email:', emailErr);
      }

      // Save user with history
      await user.save();

      // Create default academic period entry (without dates)
      try {
        await AcademicPeriod.create({
          userId: user._id,
          semester: currentSemester.toString(),
          startDate: new Date(), // Placeholder - user will set actual dates
          endDate: new Date() // Placeholder - user will set actual dates
        });
      } catch (academicErr) {
        console.error('Error creating default academic period:', academicErr);
      }

      // Create welcome notification
      await Notification.create({
        user: user._id,
        title: 'Welcome to TrackLy!',
        message: `Hi ${name}! Welcome to TrackLy. Start tracking your attendance and stay organized with your academic schedule.`,
        type: 'success',
        category: 'system'
      });

      // Create token
      await sendTokenResponse(user, 201, res);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  }
);

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post(
  '/login',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists()
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check for user
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Verify password field exists
      if (!user.password) {
        console.error('Password field missing for user:', email);
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Check if password matches
      const isMatch = await user.matchPassword(password);

      if (!isMatch) {
        console.warn('Password mismatch for user:', email);
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Get device and browser info from user agent
      const userAgent = req.headers['user-agent'] || 'Unknown device';
      let ipAddress = req.headers['x-forwarded-for'] || 
                      req.connection.remoteAddress || 
                      req.socket.remoteAddress ||
                      'Unknown IP';
      
      // Handle multiple IPs in x-forwarded-for (take first one)
      if (ipAddress.includes(',')) {
        ipAddress = ipAddress.split(',')[0].trim();
      }
      
      // Convert IPv6 localhost to IPv4
      if (ipAddress === '::1' || ipAddress === '::ffff:127.0.0.1') {
        ipAddress = '127.0.0.1';
      }
      
      // Parse user agent for more readable device/browser info
      const deviceInfo = parseUserAgent(userAgent);
      
      // Create login notification
      const loginTime = new Date();
      const loginMessage = `New login detected from ${deviceInfo.browser} on ${deviceInfo.os} at ${loginTime.toLocaleString()}`;
      
      // Save login history
      user.loginHistory.push({
        timestamp: loginTime,
        ipAddress: ipAddress,
        userAgent: userAgent,
        deviceInfo: deviceInfo
      });
      
      user.accountActivity.push({
        action: 'login',
        timestamp: loginTime,
        details: {
          ipAddress: ipAddress,
          device: deviceInfo.os,
          browser: deviceInfo.browser
        }
      });
      
      await user.save();
      
      // Save notification to main database
      await Notification.create({
        user: user._id,
        title: 'New Login Detected',
        message: loginMessage,
        type: 'info',
        category: 'system'
      });
      
      // Send email notification if user has email notifications enabled
      if (user.notificationPreferences?.emailNotifications?.enabled) {
        const emailPrefs = user.notificationPreferences.emailNotifications;
        const isMutedType = emailPrefs.mutedTypes.includes('system');
        
        // Send login notification email if not muted and frequency is instant
        if (emailPrefs.frequency === 'instant' && !isMutedType) {
          try {
            const securityNotification = {
              title: 'Security Alert: New Login Detected',
              message: `A new login was detected on your TrackLy account.`
            };
            
            const emailResult = await emailService.sendSecurityEmail(
              securityNotification, 
              user.email,
              {
                ipAddress: ipAddress,
                device: deviceInfo.os,
                browser: deviceInfo.browser,
                time: loginTime.toLocaleString()
              }
            );
            
            if (emailResult.success) {
              user.emailHistory.push({
                emailType: 'security',
                subject: securityNotification.title,
                sentAt: new Date(),
                status: 'sent'
              });
              await user.save();
            }
          } catch (emailErr) {
            console.error('Error sending security email:', emailErr);
          }
        }
      }
      
      // Create token
      await sendTokenResponse(user, 200, res);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  }
);

// Parse user agent string to get device and browser info
const parseUserAgent = (userAgent) => {
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';
  
  // Detect OS
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac OS')) os = 'Mac OS';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  
  // Detect Browser
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
  else if (userAgent.includes('Edg')) browser = 'Edge';
  else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) browser = 'Internet Explorer';
  
  return { os, browser };
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const userData = user.toObject();
    userData.userSpecificData = {
      loginHistory: user.loginHistory || [],
      emailHistory: user.emailHistory || []
    };
    
    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
router.get('/logout', protect, async (req, res) => {
  res.status(200).json({
    success: true,
    data: {}
  });
});

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = async (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token
  });
};

module.exports = router; 