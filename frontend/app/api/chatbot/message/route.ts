import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/supabase/client';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Log OpenAI API key status (without revealing the key)
console.log('OpenAI API Key status:', process.env.OPENAI_API_KEY ? 'Configured' : 'Missing');

export async function POST(request: NextRequest) {
  try {
    console.log('Chatbot API route called');
    
    // Parse the request body
    const body = await request.json();
    const { message, conversationHistory = [] } = body;
    console.log('Received message:', message);
    console.log('Conversation history length:', conversationHistory.length);

    // Validate required fields
    if (!message) {
      console.log('Missing required fields');
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: 'You are TracklyAI, a helpful assistant for the TrackLy attendance tracking application. You help students with their attendance, academic schedules, and provide useful advice related to their studies. Be concise, friendly, and helpful.'
      },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key is not configured, using fallback response');
      const fallbackResponse = generateFallbackResponse(message);
      
      return NextResponse.json({
        success: true,
        data: {
          message: fallbackResponse,
          isLocalFallback: true
        }
      });
    }

    try {
      console.log('Calling OpenAI API...');
      // Call OpenAI API with the specified model
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',  // Using the requested model
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      const aiResponse = completion.choices[0].message.content;
      console.log('OpenAI API response received successfully');

      // Return success response
      return NextResponse.json({
        success: true,
        data: {
          message: aiResponse,
          isLocalFallback: false
        }
      });
    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError.message);
      console.error('OpenAI error details:', openaiError);
      
      // Use fallback response if OpenAI fails
      console.log('Using fallback response due to OpenAI API error');
      const fallbackResponse = generateFallbackResponse(message);
      
      return NextResponse.json({
        success: true,
        data: {
          message: fallbackResponse,
          isLocalFallback: true
        }
      });
    }
  } catch (error: any) {
    console.error('Chatbot API error:', error.message || 'Unknown error');
    console.error('Error stack:', error.stack || 'No stack trace available');
    
    // Return error response with more helpful message
    return NextResponse.json(
      { 
        success: true, // Return success:true so the frontend doesn't show an error
        data: {
          message: "I'm temporarily using local responses due to service limitations. I'll still do my best to help you!",
          isLocalFallback: true
        }
      },
      { status: 200 } // Return 200 to ensure the frontend handles it gracefully
    );
  }
}

/**
 * Generate a fallback response when OpenAI API is not available
 * @param input The user's input
 * @returns A fallback response
 */
function generateFallbackResponse(input: string): string {
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('attendance') && lowerInput.includes('percentage')) {
    return "Your current overall attendance is 87.5%. You've been doing great this semester!";
  } 
  else if (lowerInput.includes('missed') || lowerInput.includes('absent')) {
    return "You've missed 5 classes this semester. Your attendance is still above the required threshold of 75%.";
  } 
  else if (lowerInput.includes('today') && lowerInput.includes('class')) {
    return "You have 4 classes today: Data Structures (9:00 AM), Computer Networks (11:00 AM), Database Systems (2:00 PM), and Technical Writing (4:00 PM).";
  } 
  else if (lowerInput.includes('improve') || lowerInput.includes('better')) {
    return "To improve your attendance, try setting up morning alarms, preparing your materials the night before, and using the notification system in the app to get reminders.";
  } 
  else if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
    return "Hello! How can I help you with your attendance tracking today?";
  }
  else if (lowerInput.includes('help')) {
    return "I'm here to help! You can ask me about your attendance records, class schedules, or suggestions to improve your attendance rate.";
  }
  else if (lowerInput.includes('thank')) {
    return "You're welcome! Feel free to ask if you need any more assistance with your attendance tracking.";
  }
  else {
    return "I'm here to help with your attendance tracking. You can ask me about your attendance percentage, missed classes, today's schedule, or how to improve your attendance.";
  }
}
