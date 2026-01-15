const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getUserDbConnection, initializeUserDatabase } = require('../utils/dbManager');

// Normalize date to UTC midnight
const normalizeToUTC = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};

// Update overdue status for todos
const updateOverdueStatus = async (todos) => {
  const now = normalizeToUTC(new Date());
  
  for (const todo of todos) {
    if (todo.dueDate && !todo.completed) {
      const dueDate = normalizeToUTC(todo.dueDate);
      todo.isOverdue = dueDate < now;
    } else {
      todo.isOverdue = false;
    }
  }
  
  return todos;
};

// @route   GET /api/todo
// @desc    Get all todos for the logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { models } = initializeUserDatabase(req.user._id);
    let todos = await models.Todo.find({ user: req.user._id }).sort({ createdAt: -1 });
    
    // Update overdue status
    todos = await updateOverdueStatus(todos);
    await Promise.all(todos.map(todo => todo.save()));
    
    res.status(200).json({
      success: true,
      count: todos.length,
      data: todos
    });
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch todos',
      error: error.message
    });
  }
});

// @route   POST /api/todo
// @desc    Create a new todo
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, dueDate, priority } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }
    
    const { models } = initializeUserDatabase(req.user._id);
    
    const todo = await models.Todo.create({
      user: req.user._id,
      title: title.trim(),
      description: description?.trim() || '',
      dueDate: dueDate || null,
      priority: priority || 'medium',
      completed: false
    });
    
    res.status(201).json({
      success: true,
      data: todo
    });
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create todo',
      error: error.message
    });
  }
});

// @route   PUT /api/todo/:id
// @desc    Update a todo
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, description, dueDate, priority, completed } = req.body;
    
    const { models } = initializeUserDatabase(req.user._id);
    
    let todo = await models.Todo.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }
    
    // Update fields
    if (title !== undefined) todo.title = title.trim();
    if (description !== undefined) todo.description = description.trim();
    if (dueDate !== undefined) todo.dueDate = dueDate;
    if (priority !== undefined) todo.priority = priority;
    if (completed !== undefined) todo.completed = completed;
    
    await todo.save();
    
    res.status(200).json({
      success: true,
      data: todo
    });
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update todo',
      error: error.message
    });
  }
});

// @route   DELETE /api/todo/:id
// @desc    Delete a todo
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const { models } = initializeUserDatabase(req.user._id);
    
    const todo = await models.Todo.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    
    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Todo deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete todo',
      error: error.message
    });
  }
});

// @route   PATCH /api/todo/:id/toggle
// @desc    Toggle todo completion status
// @access  Private
router.patch('/:id/toggle', protect, async (req, res) => {
  try {
    const { models } = initializeUserDatabase(req.user._id);
    
    const todo = await models.Todo.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }
    
    todo.completed = !todo.completed;
    await todo.save();
    
    res.status(200).json({
      success: true,
      data: todo
    });
  } catch (error) {
    console.error('Error toggling todo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle todo',
      error: error.message
    });
  }
});

module.exports = router;
