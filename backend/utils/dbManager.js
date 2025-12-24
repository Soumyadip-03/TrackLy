const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Cache for database connections
const connections = {};

/**
 * Creates and returns a connection to a user-specific database
 * @param {string} userId - The user's ID to create a specific database
 * @returns {Promise<mongoose.Connection>} - Mongoose connection object
 */
exports.getUserDbConnection = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required to create a database connection');
  }
  
  // If connection already exists and is open, return it
  if (connections[userId] && connections[userId].readyState === 1) {
    return connections[userId];
  }
  
  // Get the base MongoDB URI from environment variables
  const baseUri = process.env.MONGODB_URI;
  
  if (!baseUri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  
  try {
    // Extract the base URI without database name
    const dbIndex = baseUri.lastIndexOf('/');
    const baseServer = baseUri.substring(0, dbIndex + 1);
    
    // Create user-specific database URI
    const userDbUri = `${baseServer}trackly_user_${userId}`;
    
    // Connect to the user-specific database with enhanced error handling
    const connection = mongoose.createConnection(userDbUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      heartbeatFrequencyMS: 30000
    });
    
    // Handle connection events
    connection.on('error', (err) => {
      console.error(`Error on user database connection for ${userId}:`, err);
      delete connections[userId];
    });
    
    connection.on('disconnected', () => {
      console.warn(`MongoDB connection disconnected for user ${userId}`);
      delete connections[userId];
    });
    
    connection.on('reconnected', () => {
      console.info(`MongoDB reconnected for user ${userId}`);
    });
    
    // Wait for connection to be established
    await new Promise((resolve, reject) => {
      connection.once('connected', () => {
        console.log(`Connected to user database for ${userId}`);
        resolve();
      });
      
      connection.once('error', (err) => {
        reject(new Error(`Failed to connect to user database: ${err.message}`));
      });
      
      // Add timeout for connection
      setTimeout(() => {
        if (connection.readyState !== 1) {
          reject(new Error('Connection timeout while connecting to user database'));
        }
      }, 10000);
    });
    
    // Cache the connection
    connections[userId] = connection;
    
    return connection;
  } catch (error) {
    console.error(`Failed to create user database connection for ${userId}:`, error);
    // Ensure any partially created connection is closed
    if (connections[userId]) {
      try {
        await connections[userId].close();
      } catch (closeError) {
        console.error(`Error closing partial connection for ${userId}:`, closeError);
      }
      delete connections[userId];
    }
    throw error;
  }
};

/**
 * Gets the main application database connection
 * @returns {mongoose.Connection} - Main mongoose connection
 */
exports.getMainDbConnection = () => {
  return mongoose.connection;
};

/**
 * Closes all user database connections
 * @returns {Promise<void>}
 */
exports.closeAllConnections = async () => {
  const closePromises = Object.keys(connections).map(async (userId) => {
    if (connections[userId] && connections[userId].readyState === 1) {
      await connections[userId].close();
      delete connections[userId];
    }
  });
  
  await Promise.all(closePromises);
};

/**
 * Setup user database after successful registration or login
 * @param {Object} user - User object with _id
 * @returns {Promise<void>}
 */
exports.setupUserDatabase = async (user) => {
  try {
    if (!user || !user._id) {
      throw new Error('Invalid user object');
    }
    
    // Initialize the user's database
    const { connection, models } = await exports.initializeUserDatabase(user._id);
    
    // Create or update UserInfo document
    await models.UserInfo.findOneAndUpdate(
      { mainUserId: user._id },
      {
        mainUserId: user._id,
        email: user.email,
        name: user.name,
        studentId: user.studentId
      },
      { upsert: true, new: true }
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error setting up user database:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Initialize the user's database with required collections/schemas
 * @param {string} userId - The user's ID
 * @returns {Promise<void>}
 */
exports.initializeUserDatabase = async (userId) => {
  const connection = await exports.getUserDbConnection(userId);
  
  // Check if models already exist on this connection
  let Todo, Attendance, Subject, Notification, ProjectVersion, UserInfo;
  
  try {
    Todo = connection.model('Todo');
  } catch (e) {
    Todo = connection.model('Todo', require('../models/Todo').schema);
  }
  
  try {
    Attendance = connection.model('Attendance');
  } catch (e) {
    Attendance = connection.model('Attendance', require('../models/Attendance').schema);
  }
  
  try {
    Subject = connection.model('Subject');
  } catch (e) {
    Subject = connection.model('Subject', require('../models/Subject').schema);
  }
  
  try {
    Notification = connection.model('Notification');
  } catch (e) {
    const NotificationSchema = new mongoose.Schema({
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      title: String,
      message: String,
      type: String,
      read: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    });
    Notification = connection.model('Notification', NotificationSchema);
  }
  
  try {
    ProjectVersion = connection.model('ProjectVersion');
  } catch (e) {
    ProjectVersion = connection.model('ProjectVersion', require('../models/ProjectVersion').schema);
  }
  
  // Create a UserInfo collection to store a reference to the main user
  const UserInfoSchema = new mongoose.Schema({
    mainUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    email: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    studentId: {
      type: String,
      required: true
    },
    points: {
      type: Number,
      default: 100
    },
    profilePicture: {
      filePath: String,
      fileName: String,
      originalName: String,
      uploadDate: Date,
      size: Number
    },
    pdfSchedule: {
      name: String,
      originalName: String,
      path: String,
      size: Number,
      uploadDate: Date,
      processed: {
        type: Boolean,
        default: false
      }
    },
    uploads: {
      schedule: {
        filePath: String,
        fileName: String,
        originalName: String,
        uploadDate: Date,
        size: Number
      }
    },
    chatHistory: [{
      role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true
      },
      content: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    loginHistory: [{
      timestamp: Date,
      ipAddress: String,
      userAgent: String,
      deviceInfo: Object
    }],
    emailHistory: [{
      type: String,
      subject: String,
      sentAt: Date,
      status: String
    }],
    accountActivity: [{
      action: String,
      timestamp: Date,
      details: Object
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  
  try {
    UserInfo = connection.model('UserInfo');
  } catch (e) {
    UserInfo = connection.model('UserInfo', UserInfoSchema);
  }
  
  return {
    connection,
    models: {
      Todo,
      Attendance,
      Subject,
      Notification,
      ProjectVersion,
      UserInfo
    }
  };
};
