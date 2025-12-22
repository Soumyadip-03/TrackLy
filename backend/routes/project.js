const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const ProjectVersion = require('../models/ProjectVersion');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all project versions
// @route   GET /api/project/versions
// @access  Private
router.get('/versions', protect, async (req, res) => {
  try {
    // Get global project versions from main database
    const globalVersions = await ProjectVersion.find().sort({ createdAt: -1 });
    
    // Get user-specific project versions if available
    let userVersions = [];
    if (req.userDb?.models?.ProjectVersion) {
      userVersions = await req.userDb.models.ProjectVersion.find().sort({ createdAt: -1 });
    }
    
    // Combine both versions with user-specific versions taking precedence
    const combinedVersions = [...globalVersions];
    
    // Add user versions that don't exist in global versions
    userVersions.forEach(userVersion => {
      const existingVersion = combinedVersions.findIndex(v => v.version === userVersion.version);
      if (existingVersion >= 0) {
        // Replace with user-specific version
        combinedVersions[existingVersion] = userVersion;
      } else {
        // Add new user-specific version
        combinedVersions.push(userVersion);
      }
    });
    
    // Sort by createdAt
    combinedVersions.sort((a, b) => b.createdAt - a.createdAt);
    
    res.status(200).json({
      success: true,
      count: combinedVersions.length,
      data: combinedVersions
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get latest project version
// @route   GET /api/project/version/latest
// @access  Private
router.get('/version/latest', protect, async (req, res) => {
  try {
    // Use user-specific database if available
    let latestVersion;
    
    if (req.userDb?.models?.ProjectVersion) {
      const userLatestVersions = await req.userDb.models.ProjectVersion.find()
        .sort({ createdAt: -1 })
        .limit(1);
        
      if (userLatestVersions.length > 0) {
        latestVersion = userLatestVersions[0];
      }
    }
    
    // Fall back to global version if no user-specific version found
    if (!latestVersion) {
      latestVersion = await ProjectVersion.getLatestVersion();
    }
    
    if (!latestVersion) {
      return res.status(404).json({
        success: false,
        error: 'No project versions found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: latestVersion
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Add new project version
// @route   POST /api/project/version
// @access  Private/Admin
router.post(
  '/version',
  [
    protect,
    authorize('admin'),
    body('version', 'Version is required').not().isEmpty(),
    body('description', 'Description is required').not().isEmpty(),
    body('changes', 'Changes must be an array').isArray(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    try {
      const { version, description, changes, components, author, isUserSpecific } = req.body;
      
      // If this is a user-specific version, save it to the user's database
      if (isUserSpecific && req.userDb?.models?.ProjectVersion) {
        // Check if version already exists in user database
        const existingUserVersion = await req.userDb.models.ProjectVersion.findOne({ version });
        if (existingUserVersion) {
          return res.status(400).json({
            success: false,
            error: 'Version already exists in your personal versions'
          });
        }
        
        // Create new version in user database
        const projectVersion = await req.userDb.models.ProjectVersion.create({
          version,
          description,
          changes,
          components: components || [],
          author: author || req.user.name,
          isUserSpecific: true
        });
        
        return res.status(201).json({
          success: true,
          data: projectVersion,
          message: 'User-specific version created successfully'
        });
      }
      
      // Otherwise, save to main database (global version)
      // Check if version already exists in global database
      const existingVersion = await ProjectVersion.findOne({ version });
      if (existingVersion) {
        return res.status(400).json({
          success: false,
          error: 'Version already exists in global versions'
        });
      }
      
      // Create new version
      const projectVersion = await ProjectVersion.create({
        version,
        description,
        changes,
        components: components || [],
        author: author || req.user.name
      });
      
      res.status(201).json({
        success: true,
        data: projectVersion
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  }
);

// @desc    Delete user-specific project version
// @route   DELETE /api/project/version/:version
// @access  Private
router.delete('/version/:version', protect, async (req, res) => {
  try {
    const { version } = req.params;
    
    // Can only delete user-specific versions
    if (!req.userDb?.models?.ProjectVersion) {
      return res.status(404).json({
        success: false,
        error: 'User database not found'
      });
    }
    
    // Find and delete version
    const result = await req.userDb.models.ProjectVersion.deleteOne({ 
      version,
      isUserSpecific: true
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Version not found or is not a user-specific version'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Version ${version} deleted successfully`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router; 