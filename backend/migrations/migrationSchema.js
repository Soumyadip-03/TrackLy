const mongoose = require('mongoose');

const MigrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  version: {
    type: String,
    required: true
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'applied', 'failed'],
    default: 'pending'
  }
});

module.exports = mongoose.model('Migration', MigrationSchema); 