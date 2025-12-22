const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Please provide a message'],
    trim: true
  },
  type: {
    type: String,
    enum: ['attendance', 'todo', 'system', 'point'],
    default: 'system'
  },
  read: {
    type: Boolean,
    default: false
  },
  relatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'onModel',
    default: null
  },
  onModel: {
    type: String,
    enum: ['Subject', 'Todo', null],
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', NotificationSchema); 