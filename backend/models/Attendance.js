const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  subjectName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    required: true
  },
  classType: {
    type: String,
    enum: ['lecture', 'lab', 'tutorial', 'seminar', 'workshop', 'sports', 'yoga', 'preparatory', 'none'],
    default: 'none'
  },
  isAutoMarked: {
    type: Boolean,
    default: false
  },
  scheduleClassId: {
    type: String,
    default: ''
  },
  hasPreparatoryTag: {
    type: Boolean,
    default: false
  },
  timeDuration: {
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' }
  },
  calculationType: {
    type: String,
    enum: ['wholeDay', 'perSubject'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to allow multiple slots of same subject on same day
// Using scheduleClassId to differentiate between different time slots
AttendanceSchema.index({ user: 1, subject: 1, date: 1, scheduleClassId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema); 