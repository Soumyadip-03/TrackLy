const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a subject name'],
    trim: true,
    maxlength: [100, 'Subject name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Please provide a subject code'],
    trim: true
  },
  classType: {
    type: String,
    enum: ['lecture', 'lab', 'tutorial', 'seminar', 'workshop', 'sports', 'yoga', 'none'],
    default: 'none'
  },
  semester: {
    type: Number,
    required: [true, 'Please provide a semester number'],
    min: 1
  },
  totalClasses: {
    type: Number,
    default: 0
  },
  attendedClasses: {
    type: Number,
    default: 0
  },
  classesPerWeek: {
    type: Number,
    default: 0
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  schedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate attendance percentage
SubjectSchema.methods.getAttendancePercentage = function() {
  if (this.totalClasses === 0) return 100;
  return (this.attendedClasses / this.totalClasses) * 100;
};

module.exports = mongoose.model('Subject', SubjectSchema); 