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
    required: false,
    trim: true,
    default: ''
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
  academicPeriodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicPeriod',
    required: false
  },
  totalClasses: {
    type: Number,
    default: 0
  },
  attendedClasses: {
    type: Number,
    default: 0
  },
  classTypeStats: {
    lecture: {
      total: { type: Number, default: 0 },
      attended: { type: Number, default: 0 }
    },
    lab: {
      total: { type: Number, default: 0 },
      attended: { type: Number, default: 0 }
    },
    tutorial: {
      total: { type: Number, default: 0 },
      attended: { type: Number, default: 0 }
    },
    seminar: {
      total: { type: Number, default: 0 },
      attended: { type: Number, default: 0 }
    },
    workshop: {
      total: { type: Number, default: 0 },
      attended: { type: Number, default: 0 }
    },
    sports: {
      total: { type: Number, default: 0 },
      attended: { type: Number, default: 0 }
    },
    yoga: {
      total: { type: Number, default: 0 },
      attended: { type: Number, default: 0 }
    },
    none: {
      total: { type: Number, default: 0 },
      attended: { type: Number, default: 0 }
    }
  },
  targetPercentage: {
    type: Number,
    default: 75,
    min: 0,
    max: 100
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

SubjectSchema.index({ user: 1, academicPeriodId: 1 });

SubjectSchema.methods.getAttendancePercentage = function() {
  if (this.totalClasses === 0) return 100;
  return (this.attendedClasses / this.totalClasses) * 100;
};

module.exports = mongoose.model('Subject', SubjectSchema); 