const { getUserDbConnection, initializeUserDatabase } = require('../utils/dbManager');

/**
 * Middleware to attach the user's specific database connection to the request object
 * This should be used after authentication middleware to ensure req.user is available
 */
exports.attachUserDb = async (req, res, next) => {
  try {
    // Skip if no authenticated user
    if (!req.user || !req.user.id) {
      console.warn('attachUserDb: No user ID available, skipping database attachment');
      return next();
    }
    
    // Initialize or get existing user database
    const { connection, models } = await initializeUserDatabase(req.user.id);
    
    if (!connection || connection.readyState !== 1) {
      console.error(`User database connection failed for user ${req.user.id}. Connection state: ${connection?.readyState}`);
      throw new Error('Failed to connect to user database');
    }
    
    // Attach the user-specific connection and models to the request
    req.userDb = {
      connection,
      models
    };
    
    console.log(`Successfully attached user database for user ${req.user.id}`);
    next();
  } catch (error) {
    console.error('Error connecting to user database:', error);
    // If in development mode, fail the request for debugging purposes
    if (process.env.NODE_ENV === 'development') {
      return res.status(500).json({
        success: false,
        error: 'Failed to connect to user database',
        details: error.message
      });
    }
    // In production, continue anyway with main database as fallback
    req.userDb = {
      connection: null,
      models: null,
      error: error.message
    };
    next();
  }
};

/**
 * Create user database after successful registration or login
 * @param {Object} user - User object with _id
 * @returns {Promise<void>}
 */
exports.setupUserDatabase = async (user) => {
  try {
    if (!user || !user._id) {
      throw new Error('Invalid user object');
    }
    
    // Initialize the user's database
    const { connection, models } = await initializeUserDatabase(user._id);
    
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
 * Update user info in the user-specific database
 * @param {Object} user - User object with updated fields
 * @returns {Promise<Object>} - Result of the update operation
 */
exports.updateUserInfo = async (user) => {
  try {
    if (!user || !user._id) {
      throw new Error('Invalid user object');
    }
    
    // Initialize the user's database
    const { models } = await initializeUserDatabase(user._id);
    
    // Update UserInfo document
    const updatedUserInfo = await models.UserInfo.findOneAndUpdate(
      { mainUserId: user._id },
      {
        name: user.name,
        email: user.email,
        studentId: user.studentId
      },
      { new: true }
    );
    
    return { 
      success: true,
      data: updatedUserInfo
    };
  } catch (error) {
    console.error('Error updating user info in user database:', error);
    return { success: false, error: error.message };
  }
}; 