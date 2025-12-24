const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const OpenAI = require('openai');
const { protect } = require('../middleware/auth');

// Initialize OpenAI lazily (only when API key is available)
let openai = null;
function getOpenAIClient() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
}

/**
 * Generate a fallback response based on the user's message
 */
function generateFallbackResponse(message, userName) {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('attendance') && lowerMsg.includes('percentage')) {
    return `Hi ${userName}, your current overall attendance is 87.5%. You've been doing great this semester!`;
  } 
  else if (lowerMsg.includes('missed') || lowerMsg.includes('absent')) {
    return `Based on your records, you've missed 5 classes this semester. Your attendance is still above the required threshold of 75%.`;
  }
  else if (lowerMsg.includes('today') && lowerMsg.includes('class')) {
    return `Your schedule for today includes: Data Structures (9:00 AM), Computer Networks (11:00 AM), Database Systems (2:00 PM), and Technical Writing (4:00 PM).`;
  }
  else if (lowerMsg.includes('improve') || lowerMsg.includes('better')) {
    return `To improve your attendance, I recommend setting up morning alarms, preparing your materials the night before, and using the notification system in TrackLy to get reminders.`;
  }
  else if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
    return `Hello ${userName}! How can I help you with your attendance tracking today?`;
  }
  else if (lowerMsg.includes('help')) {
    return `I'm here to help! You can ask me about your attendance records, class schedules, or suggestions to improve your attendance rate.`;
  }
  else if (lowerMsg.includes('thank')) {
    return `You're welcome, ${userName}! Feel free to ask if you need any more assistance with your attendance tracking.`;
  }
  else {
    return `As your attendance assistant, I can help you track attendance, manage your schedule, or suggest improvements. What would you like to know about today?`;
  }
}

// @desc    Get conversation history
// @route   GET /api/chatbot/history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    // Get conversation history from user-specific database
    const chatHistory = await req.userDb.models.UserInfo.findOne(
      { mainUserId: req.user._id },
      { 'chatHistory': 1 }
    );
    
    res.status(200).json({
      success: true,
      data: chatHistory?.chatHistory || []
    });
  } catch (err) {
    console.error('Error retrieving chat history:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// @desc    Send message to AI chatbot
// @route   POST /api/chatbot/message
// @access  Private
router.post(
  '/message',
  protect,
  [
    body('message', 'Message is required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { message, conversationHistory = [] } = req.body;
    
    try {
      // Prepare messages for OpenAI API
      const messages = [
        { 
          role: 'system', 
          content: `You are a helpful assistant for a student attendance tracking application called TrackLy. 
          You can help with questions about attendance tracking, schedule management, 
          to-do lists, and general productivity tips for students. 
          Keep your responses concise, helpful, and focused on academic productivity.
          The user's name is ${req.user.name} and they are currently in semester ${req.user.currentSemester}.` 
        },
        ...conversationHistory,
        { role: 'user', content: message }
      ];

      let aiResponse;
      let isLocalFallback = false;

      // Try to call OpenAI API
      try {
        const openaiClient = getOpenAIClient();
        if (!openaiClient) {
          throw new Error('OpenAI API key not configured');
        }
        const completion = await openaiClient.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages,
          max_tokens: 600
        });

        // Extract the response
        aiResponse = completion.choices[0].message.content;
      } catch (openAIError) {
        // More detailed error logging for OpenAI errors
        let errorType = 'Unknown OpenAI Error';
        if (openAIError.status === 429) {
          errorType = 'Rate Limit or Quota Exceeded';
        } else if (openAIError.code === 'insufficient_quota') {
          errorType = 'Insufficient Quota';
        }
        
        console.error(`OpenAI API Error (${errorType}):`, openAIError.message || openAIError);
        
        // Generate a fallback response
        aiResponse = generateFallbackResponse(message, req.user.name || 'there');
        isLocalFallback = true;
      }

      // Store the conversation in the user-specific database
      // First, get the current chat history
      const userInfo = await req.userDb.models.UserInfo.findOne({ mainUserId: req.user._id });
      
      // Initialize or update chat history
      const chatHistory = userInfo?.chatHistory || [];
      chatHistory.push({ role: 'user', content: message });
      chatHistory.push({ role: 'assistant', content: aiResponse, timestamp: new Date() });
      
      // Limit chat history to last 20 messages (10 exchanges)
      const limitedHistory = chatHistory.slice(-20);
      
      // Update the user info with the new chat history
      await req.userDb.models.UserInfo.findOneAndUpdate(
        { mainUserId: req.user._id },
        { $set: { chatHistory: limitedHistory } },
        { new: true, upsert: true }
      );

      return res.status(200).json({
        success: true,
        data: {
          message: aiResponse,
          role: 'assistant',
          isLocalFallback: isLocalFallback
        }
      });
    } catch (err) {
      console.error('Server Error:', err);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// @desc    Clear chat history
// @route   DELETE /api/chatbot/history
// @access  Private
router.delete('/history', protect, async (req, res) => {
  try {
    // Clear chat history in user-specific database
    await req.userDb.models.UserInfo.findOneAndUpdate(
      { mainUserId: req.user._id },
      { $set: { chatHistory: [] } }
    );
    
    res.status(200).json({
      success: true,
      message: 'Chat history cleared successfully'
    });
  } catch (err) {
    console.error('Error clearing chat history:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router; 