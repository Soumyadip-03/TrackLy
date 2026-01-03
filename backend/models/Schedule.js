const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  academicPeriodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicPeriod',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userSemester: {
    type: Number,
    required: true
  },
  scheduleId: {
    type: String,
    required: true,
    unique: true
  },
  schedule: {
    classes: [{
      day: { type: String, required: true },
      subject: { type: String, required: true },
      type: { type: String, required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
      building: { type: String },
      room: { type: String }
    }],
    offDays: [{ type: String }]
  }
}, { timestamps: true });

scheduleSchema.index({ userId: 1, academicPeriodId: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
