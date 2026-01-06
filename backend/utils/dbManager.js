const mongoose = require('mongoose');

/**
 * DEPRECATED: No longer creating user-specific databases
 * All users now share the main database with userId-based isolation
 * @param {string} userId - The user's ID (kept for backward compatibility)
 * @returns {mongoose.Connection} - Main mongoose connection
 */
exports.getUserDbConnection = (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  // Return the main database connection
  return mongoose.connection;
};

/**
 * Gets the main application database connection
 * @returns {mongoose.Connection} - Main mongoose connection
 */
exports.getMainDbConnection = () => {
  return mongoose.connection;
};

/**
 * DEPRECATED: No longer needed as we use single shared database
 * @returns {Promise<void>}
 */
exports.closeAllConnections = async () => {
  // No-op: Main connection is managed by mongoose
  return Promise.resolve();
};

/**
 * DEPRECATED: No longer needed with single shared database
 * User data is automatically isolated by userId field in documents
 * @param {Object} user - User object with _id
 * @returns {Promise<void>}
 */
exports.setupUserDatabase = async (user) => {
  // No-op: User data is stored in main database with userId field
  return { success: true };
};

/**
 * Returns models from the main shared database
 * All models use userId field for data isolation
 * @param {string} userId - The user's ID (kept for backward compatibility)
 * @returns {Object} - Connection and models object
 */
exports.initializeUserDatabase = (userId) => {
  const connection = mongoose.connection;
  
  // Return standard models from main database
  const models = {
    Todo: require('../models/Todo'),
    Attendance: require('../models/Attendance'),
    Subject: require('../models/Subject'),
    Notification: require('../models/Notification'),
    Schedule: require('../models/Schedule'),
    ChatHistory: require('../models/ChatHistory'),
    Upload: require('../models/Upload')
  };
  
  return {
    connection,
    models
  };
};
