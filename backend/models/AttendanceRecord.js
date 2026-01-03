const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  subjects: [{
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      required: true
    }
  }]
}, { timestamps: true });

attendanceRecordSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
