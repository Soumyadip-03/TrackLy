const mongoose = require('mongoose');

// Define an example ProjectVersion schema
const ProjectVersionSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true,
    unique: true
  },
  releaseDate: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    required: true
  },
  changes: [{
    type: String,
    required: true
  }],
  author: {
    type: String,
    default: 'System'
  }
});

// Migration information
const description = 'Create project version tracking collection';
const version = '1.0.0';

// Up migration - What to do when applying this migration
const up = async () => {
  try {
    // Create the model
    const ProjectVersion = mongoose.model('ProjectVersion', ProjectVersionSchema);
    
    // Add initial version
    await ProjectVersion.create({
      version: '1.0.0',
      description: 'Initial release',
      changes: [
        'Initial project setup',
        'User authentication',
        'Attendance tracking',
        'Todo management'
      ]
    });
    
    console.log('Successfully created ProjectVersion collection');
  } catch (error) {
    console.error('Error in migration:', error);
    throw error;
  }
};

// Down migration - How to revert this migration
const down = async () => {
  try {
    // Drop the collection
    await mongoose.connection.dropCollection('projectversions');
    console.log('Successfully dropped ProjectVersion collection');
  } catch (error) {
    console.error('Error in migration rollback:', error);
    throw error;
  }
};

module.exports = {
  description,
  version,
  up,
  down
}; 