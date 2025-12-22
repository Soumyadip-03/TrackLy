const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Todo = require('../models/Todo');
const { protect } = require('../middleware/auth');

// @desc    Get all todos for current user
// @route   GET /api/todo
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const todos = await req.userDb.models.Todo.find()
      .populate('subject', 'name code')
      .sort({ date: 1, completed: 1 });

    res.status(200).json({
      success: true,
      count: todos.length,
      data: todos
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get todos by date
// @route   GET /api/todo/date/:date
// @access  Private
router.get('/date/:date', protect, async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);

    const todos = await req.userDb.models.Todo.find({ 
      date: { $gte: date, $lt: nextDay }
    })
      .populate('subject', 'name code')
      .sort({ time: 1, completed: 1 });

    res.status(200).json({
      success: true,
      count: todos.length,
      data: todos
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get todos by subject
// @route   GET /api/todo/subject/:subjectId
// @access  Private
router.get('/subject/:subjectId', protect, async (req, res) => {
  try {
    const todos = await req.userDb.models.Todo.find({ 
      subject: req.params.subjectId
    })
      .populate('subject', 'name code')
      .sort({ date: 1, completed: 1 });

    res.status(200).json({
      success: true,
      count: todos.length,
      data: todos
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get single todo
// @route   GET /api/todo/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const todo = await req.userDb.models.Todo.findById(req.params.id)
      .populate('subject', 'name code');

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
    }

    res.status(200).json({
      success: true,
      data: todo
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Create new todo
// @route   POST /api/todo
// @access  Private
router.post(
  '/',
  protect,
  [
    body('title', 'Title is required').not().isEmpty(),
    body('date', 'Date is required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { title, description, date, time, subject } = req.body;

      // Create todo
      const todo = await req.userDb.models.Todo.create({
        title,
        description,
        date,
        time,
        subject
      });

      res.status(201).json({
        success: true,
        data: todo
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

// @desc    Update todo
// @route   PUT /api/todo/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let todo = await req.userDb.models.Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
    }

    // Update fields
    const { title, description, date, time, subject, completed } = req.body;
    if (title) todo.title = title;
    if (description !== undefined) todo.description = description;
    if (date) todo.date = date;
    if (time !== undefined) todo.time = time;
    if (subject !== undefined) todo.subject = subject || null;
    if (completed !== undefined) todo.completed = completed;

    await todo.save();

    res.status(200).json({
      success: true,
      data: todo
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete todo
// @route   DELETE /api/todo/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const todo = await req.userDb.models.Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
    }

    await todo.deleteOne();

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