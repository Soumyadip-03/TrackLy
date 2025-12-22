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
      serverSelectionTimeoutMS: 10000, // Increased timeout for initial connection
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
 * Initialize the user's database with required collections/schemas
 * @param {string} userId - The user's ID
 * @returns {Promise<void>}
 */
exports.initializeUserDatabase = async (userId) => {
  const connection = await exports.getUserDbConnection(userId);
  
  // Define the models specific to this user's database
  const Todo = connection.model('Todo', require('../models/Todo').schema);
  const Attendance = connection.model('Attendance', require('../models/Attendance').schema);
  const Subject = connection.model('Subject', require('../models/Subject').schema);
  const Notification = connection.model('Notification', require('../models/Notification').schema);
  const ProjectVersion = connection.model('ProjectVersion', require('../models/ProjectVersion').schema);
  
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
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  
  const UserInfo = connection.model('UserInfo', UserInfoSchema);
  
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