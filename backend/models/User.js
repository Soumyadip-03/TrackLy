const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  studentId: {
    type: String,
    required: [true, 'Please provide a student ID'],
    unique: true,
    trim: true
  },
  currentSemester: {
    type: Number,
    required: [true, 'Please provide current semester number'],
    min: 1
  },
  googleId: {
    type: String,
    default: null
  },
  profilePicture: {
    type: String,
    default: null
  },
  pdfSchedule: {
    name: String,
    originalName: String,
    path: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    processed: {
      type: Boolean,
      default: false
    }
  },
  points: {
    type: Number,
    default: 100
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  notificationPreferences: {
    emailNotifications: {
      enabled: {
        type: Boolean,
        default: false
      },
      frequency: {
        type: String,
        enum: ['instant', 'daily', 'weekly', 'never'],
        default: 'daily'
      },
      lastDigestSent: {
        type: Date,
        default: null
      },
      mutedTypes: {
        type: [String],
        default: []
      }
    },
    attendanceReminders: {
      type: Boolean,
      default: true
    },
    attendanceThreshold: {
      type: String,
      default: '75'
    },
    attendanceReminderFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'never'],
      default: 'never'
    },
    todoReminders: {
      type: Boolean,
      default: true
    },
    todoReminderTime: {
      type: String,
      default: '1'
    },
    priorityTodosOnly: {
      type: Boolean,
      default: false
    },
    calendarReminders: {
      type: Boolean,
      default: true
    },
    calendarReminderTime: {
      type: String,
      default: '1'
    }
  },
  loginHistory: [{
    timestamp: Date,
    ipAddress: String,
    userAgent: String,
    deviceInfo: {
      os: String,
      browser: String
    }
  }],
  emailHistory: [{
    emailType: String,
    subject: String,
    sentAt: Date,
    status: String
  }],
  accountActivity: [{
    action: String,
    timestamp: Date,
    details: Object
  }],
  lastAttendanceUpdate: {
    type: Date,
    default: Date.now
  },
  holidays: [{
    id: String,
    day: Number,
    month: Number,
    year: Number,
    reason: String,
    semester: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
  if (this.password && this.password.startsWith('$2')) {
    console.warn('Password appears to be already hashed, skipping re-hashing');
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Match password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema); 