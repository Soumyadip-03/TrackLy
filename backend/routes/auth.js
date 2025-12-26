const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
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

      // Set up user database immediately to store emails and activities
      const { models } = await initializeUserDatabase(user._id);

      // Track registration in user-specific database
      await models.UserInfo.findOneAndUpdate(
        { mainUserId: user._id },
        { 
          $set: {
            accountActivity: [{
              action: 'account_created',
              timestamp: new Date(),
              details: {
                email: email,
                name: name,
                studentId: studentId,
                currentSemester: currentSemester
              }
            }]
          }
        },
        { upsert: true, new: true }
      );

      // Send welcome email
      try {
        const welcomeResult = await sendWelcomeEmail(email, name);
        console.log(`Welcome email to ${email}: ${welcomeResult.success ? 'Sent' : 'Failed'}`);
        
        // Track in user-specific database
        if (welcomeResult.success) {
          await models.UserInfo.findOneAndUpdate(
            { mainUserId: user._id },
            { 
              $push: { 
                'emailHistory': {
                  type: 'welcome',
                  subject: 'Welcome to TrackLy',
                  sentAt: new Date(),
                  status: 'sent'
                }
              }
            }
          );
        }
      } catch (emailErr) {
        console.error('Error sending welcome email:', emailErr);
        // Don't stop registration if email fails
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
        
        // Track in user-specific database
        if (confirmResult.success) {
          await models.UserInfo.findOneAndUpdate(
            { mainUserId: user._id },
            { 
              $push: { 
                'emailHistory': {
                  type: 'confirmation',
                  subject: accountConfirmation.title,
                  sentAt: new Date(),
                  status: 'sent'
                }
              }
            }
          );
        }
      } catch (emailErr) {
        console.error('Error sending account confirmation email:', emailErr);
        // Don't stop registration if email fails
      }

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
      
      // Initialize user-specific database
      const { models } = await initializeUserDatabase(user._id);
      
      // Save login history to user-specific database
      await models.UserInfo.findOneAndUpdate(
        { mainUserId: user._id },
        { 
          $push: { 
            'loginHistory': {
              timestamp: loginTime,
              ipAddress: ipAddress,
              userAgent: userAgent,
              deviceInfo: deviceInfo
            },
            'accountActivity': {
              action: 'login',
              timestamp: loginTime,
              details: {
                ipAddress: ipAddress,
                device: deviceInfo.os,
                browser: deviceInfo.browser
              }
            }
          }
        },
        { upsert: true, new: true }
      );
      
      // Save notification to main database (legacy) and user-specific database
      const notification = await Notification.create({
        user: user._id,
        title: 'New Login Detected',
        message: loginMessage,
        type: 'system'
      });
      
      // Also save notification in user-specific database
      await models.Notification.create({
        title: 'New Login Detected',
        message: loginMessage,
        type: 'system'
      });
      
      // Send email notification if user has email notifications enabled
      if (user.notificationPreferences?.emailNotifications?.enabled) {
        const emailPrefs = user.notificationPreferences.emailNotifications;
        const isMutedType = emailPrefs.mutedTypes.includes('system');
        
        // Send login notification email if not muted and frequency is instant
        if (emailPrefs.frequency === 'instant' && !isMutedType) {
          const securityNotification = {
            title: 'Security Alert: New Login Detected',
            message: `A new login was detected on your TrackLy account.`
          };
          
          // Use the specialized security email method with metadata
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
          
          // Track email in user-specific database
          if (emailResult.success) {
            await models.UserInfo.findOneAndUpdate(
              { mainUserId: user._id },
              { 
                $push: { 
                  'emailHistory': {
                    type: 'security',
                    subject: securityNotification.title,
                    sentAt: new Date(),
                    status: 'sent',
                    details: {
                      ipAddress: ipAddress,
                      device: deviceInfo.os,
                      browser: deviceInfo.browser
                    }
                  }
                }
              }
            );
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
    
    // Get additional user data from user-specific database
    const userInfo = await req.userDb.models.UserInfo.findOne(
      { mainUserId: req.user.id },
      { 
        loginHistory: { $slice: -5 },  // Get only last 5 logins
        emailHistory: { $slice: -5 },  // Get only last 5 emails
        accountActivity: { $slice: -10 } // Get last 10 activities
      }
    );
    
    // Convert to plain object to ensure _id is included
    const userObject = user.toObject();
    
    // Ensure _id is always present for frontend
    if (!userObject._id && userObject.id) {
      userObject._id = userObject.id;
    }
    
    // Combine data for response
    const combinedData = {
      ...userObject,
      userSpecificData: userInfo || {}
    };
    
    res.status(200).json({
      success: true,
      data: combinedData
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
  try {
    // Record logout in user-specific database
    await req.userDb.models.UserInfo.findOneAndUpdate(
      { mainUserId: req.user.id },
      { 
        $push: { 
          'accountActivity': {
            action: 'logout',
            timestamp: new Date()
          }
        }
      }
    );
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error('Error logging logout:', err);
    // Still return success even if logging fails
    res.status(200).json({
      success: true,
      data: {}
    });
  }
});

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = async (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  try {
    // Set up user-specific database
    await setupUserDatabase(user);
    
    res.status(statusCode).json({
      success: true,
      token
    });
  } catch (err) {
    console.error('Error setting up user database:', err);
    // Still send the token even if database setup fails
    res.status(statusCode).json({
      success: true,
      token
    });
  }
};

module.exports = router; 