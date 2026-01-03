const { getUserDbConnection, initializeUserDatabase } = require('../utils/dbManager');

/**
 * Middleware to attach the user's database models to the request object
 * Now uses shared database with userId-based isolation
 */
exports.attachUserDb = async (req, res, next) => {
  try {
    // Skip if no authenticated user
    if (!req.user || !req.user.id) {
      console.warn('attachUserDb: No user ID available, skipping database attachment');
      return next();
    }
    
    // Get models from shared database
    const { connection, models } = initializeUserDatabase(req.user.id);
    
    if (!connection || connection.readyState !== 1) {
      console.error(`Database connection failed. Connection state: ${connection?.readyState}`);
      throw new Error('Failed to connect to database');
    }
    
    // Attach the models to the request
    req.userDb = {
      connection,
      models
    };
    
    next();
  } catch (error) {
    console.error('Error attaching database:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to connect to database',
      details: error.message
    });
  }
};

/**
 * DEPRECATED: No longer needed with single shared database
 * @param {Object} user - User object with _id
 * @returns {Promise<void>}
 */
exports.setupUserDatabase = async (user) => {
  // No-op: User data is stored in main database with userId field
  return { success: true };
};

/**
 * DEPRECATED: No longer needed with single shared database
 * @param {Object} user - User object with updated fields
 * @returns {Promise<Object>} - Result of the update operation
 */
exports.updateUserInfo = async (user) => {
  // No-op: Deprecated function, no longer uses UserInfo
  return { success: true };
}; 