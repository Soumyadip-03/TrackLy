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
  date: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: [true, 'Please provide a reason for the holiday']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
HolidaySchema.index({ academicPeriodId: 1 });
HolidaySchema.index({ userId: 1 });
HolidaySchema.index({ date: 1 });

// Prevent duplicate holidays for same date in same academic period
HolidaySchema.index({ academicPeriodId: 1, date: 1 }, { unique: true });

// Virtual fields for backward compatibility
HolidaySchema.virtual('day').get(function() {
  return this.date.getDate();
});

HolidaySchema.virtual('month').get(function() {
  return this.date.getMonth() + 1;
});

HolidaySchema.virtual('year').get(function() {
  return this.date.getFullYear();
});

// Ensure virtuals are included in JSON
HolidaySchema.set('toJSON', { virtuals: true });
HolidaySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Holiday', HolidaySchema);
