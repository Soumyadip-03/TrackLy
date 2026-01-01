const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Subject = require('../models/Subject');
const { protect } = require('../middleware/auth');

// @desc    Get all subjects for current user
// @route   GET /api/subject
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const subjects = await Subject.find({ user: req.user._id })
      .sort({ semester: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get subjects by semester
// @route   GET /api/subject/semester/:semester
// @access  Private
router.get('/semester/:semester', protect, async (req, res) => {
  try {
    const subjects = await Subject.find({ 
      user: req.user._id,
      semester: req.params.semester
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get single subject
// @route   GET /api/subject/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, user: req.user._id });

    if (!subject) {
      return res.status(404).json({
        success: false,
        error: 'Subject not found'
      });
    }

    res.status(200).json({
      success: true,
      data: subject
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Create new subject
// @route   POST /api/subject
// @access  Private
router.post(
  '/',
  protect,
  [
    body('name', 'Name is required').not().isEmpty(),
    body('code', 'Code is required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { name, code, classType, semester, schedule, classesPerWeek } = req.body;

      // Create subject
      const subject = await Subject.create({
        user: req.user._id,
        name,
        code,
        classType: classType || 'none',
        semester: semester || 1,
        schedule: schedule || [],
        classesPerWeek: classesPerWeek || 0
      });

      res.status(201).json({
        success: true,
        data: subject
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  }
);

// @desc    Update subject
// @route   PUT /api/subject/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let subject = await Subject.findOne({ _id: req.params.id, user: req.user._id });

    if (!subject) {
      return res.status(404).json({
        success: false,
        error: 'Subject not found'
      });
    }

    // Update fields
    const { name, code, classType, semester, schedule, classesPerWeek } = req.body;
    if (name) subject.name = name;
    if (code) subject.code = code;
    if (classType) subject.classType = classType;
    if (semester) subject.semester = semester;
    if (schedule) subject.schedule = schedule;
    if (classesPerWeek !== undefined) subject.classesPerWeek = classesPerWeek;

    await subject.save();

    res.status(200).json({
      success: true,
      data: subject
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete subject
// @route   DELETE /api/subject/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, user: req.user._id });

    if (!subject) {
      return res.status(404).json({
        success: false,
        error: 'Subject not found'
      });
    }

    await subject.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router; 