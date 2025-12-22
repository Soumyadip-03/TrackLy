const mongoose = require('mongoose');

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
  },
  components: [{
    name: {
      type: String,
      required: true
    },
    version: {
      type: String,
      required: true
    },
    changes: [{
      type: String
    }]
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add method to get latest version
ProjectVersionSchema.statics.getLatestVersion = async function() {
  const versions = await this.find().sort({ createdAt: -1 }).limit(1);
  return versions[0] || null;
};

// Add method to add a new version
ProjectVersionSchema.statics.addNewVersion = async function(versionData) {
  return await this.create(versionData);
};

module.exports = mongoose.model('ProjectVersion', ProjectVersionSchema); 