const mongoose = require('mongoose');

const HolidaySchema = new mongoose.Schema({
  academicPeriodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicPeriod',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  day: {
    type: Number,
    required: [true, 'Please provide day'],
    min: 1,
    max: 31
  },
  month: {
    type: Number,
    required: [true, 'Please provide month'],
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: [true, 'Please provide year']
  },
  reason: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
HolidaySchema.index({ academicPeriodId: 1 });
HolidaySchema.index({ userId: 1 });

// Prevent duplicate holidays for same date in same academic period
HolidaySchema.index({ academicPeriodId: 1, day: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Holiday', HolidaySchema);
