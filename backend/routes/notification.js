const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { 
  updateNotificationPreferences, 
  createNotification,
  sendWelcomeEmail 
} = require('../controllers/notificationController');

// @desc    Create a notification
// @route   POST /api/notification
// @access  Private
router.post('/', protect, createNotification);

// @desc    Send welcome email
// @route   POST /api/notification/welcome
// @access  Private - Admin only
router.post('/welcome', protect, async (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to send welcome emails'
    });
  }
  next();
}, sendWelcomeEmail);

// @desc    Update notification preferences
// @route   PUT /api/notification/preferences
// @access  Private
router.put('/preferences', protect, updateNotificationPreferences);

// @desc    Get all notifications for current user
// @route   GET /api/notification
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await req.userDb.models.Notification.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get unread notifications for current user
// @route   GET /api/notification/unread
// @access  Private
router.get('/unread', protect, async (req, res) => {
  try {
    const notifications = await req.userDb.models.Notification.find({ 
      read: false
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notification/:id/read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await req.userDb.models.Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notification/read-all
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    await req.userDb.models.Notification.updateMany(
      { read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete notification
// @route   DELETE /api/notification/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await req.userDb.models.Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    await notification.deleteOne();

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

// @desc    Delete all read notifications
// @route   DELETE /api/notification/clear-read
// @access  Private
router.delete('/clear-read', protect, async (req, res) => {
  try {
    await req.userDb.models.Notification.deleteMany({
      read: true
    });

    res.status(200).json({
      success: true,
      message: 'All read notifications cleared'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Send welcome email (TEST ENDPOINT - remove in production)
// @route   POST /api/notification/test-welcome
// @access  Public
router.post('/test-welcome', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate email format
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({
        success: false,
        error: 'Valid email address is required'
      });
    }
    
    // Create a welcome notification object (not stored in DB)
    const welcomeNotification = {
      title: 'Welcome to TrackLy',
      message: 'Thank you for joining TrackLy, your student attendance tracking companion! ' +
               'We\'re excited to help you stay on top of your attendance and academic goals. ' +
               'Start by setting up your subjects and schedule to get the most out of TrackLy.',
      type: 'system',
      createdAt: new Date()
    };
    
    const nodemailer = require('nodemailer');
    
    // Create a transporter object
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Email content
    const mailOptions = {
      from: `"TrackLy" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: welcomeNotification.title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #3b82f6;">TrackLy</h1>
            <p style="color: #666;">Student Attendance Tracking System</p>
          </div>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-top: 0;">${welcomeNotification.title}</h2>
            <p style="color: #4b5563; line-height: 1.5;">${welcomeNotification.message}</p>
          </div>
          <div style="text-align: center; font-size: 12px; color: #9ca3af;">
            <p>© ${new Date().getFullYear()} TrackLy. All rights reserved.</p>
            <p>If you prefer not to receive these emails, you can change your notification settings in the TrackLy app.</p>
          </div>
        </div>
      `
    };

    // Send email
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Test welcome email sent successfully');
      console.log('Message ID:', info.messageId);
      
      return res.status(200).json({
        success: true,
        message: `Welcome email sent to ${email}`,
        data: { messageId: info.messageId }
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      return res.status(500).json({
        success: false,
        error: `Failed to send email: ${emailError.message}`,
        details: JSON.stringify(emailError)
      });
    }
  } catch (err) {
    console.error('Error in test-welcome endpoint:', err);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: err.message
    });
  }
});

// @desc    Send security email test (TEST ENDPOINT - remove in production)
// @route   POST /api/notification/test-security
// @access  Public
router.post('/test-security', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate email format
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({
        success: false,
        error: 'Valid email address is required'
      });
    }
    
    // Create a security notification object (not stored in DB)
    const securityNotification = {
      title: 'Security Alert: Test Login',
      message: 'This is a test of the TrackLy security alert system.'
    };
    
    // Send the security email with test metadata
    const result = await emailService.sendSecurityEmail(
      securityNotification, 
      email,
      {
        ipAddress: '192.168.1.1 (Test IP)',
        device: 'Test Device',
        browser: 'Test Browser',
        time: new Date().toLocaleString(),
        location: 'Test Location (not your actual location)'
      }
    );
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: `Failed to send security email: ${result.error}`
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Security test email sent to ${email}`,
      data: { messageId: result.messageId }
    });
  } catch (err) {
    console.error('Error sending security test email:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router; 