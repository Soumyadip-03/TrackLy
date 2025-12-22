import { NextRequest, NextResponse } from 'next/server';
import { EmailScheduler } from '@/lib/services/email-scheduler';

/**
 * API Route to send weekly attendance reports
 * This can be called by a cron job or scheduler
 * 
 * Example: 
 * - Set up a cron job to hit this endpoint every Sunday night
 * - Use a service like Vercel Cron Jobs or a third-party scheduler
 */
export async function GET(request: NextRequest) {
  try {
    // Verify API key for security (optional - implement your own auth method)
    const apiKey = request.headers.get('x-api-key');
    const validApiKey = process.env.EMAIL_API_KEY;
    
    if (apiKey !== validApiKey) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Send weekly reports
    const result = await EmailScheduler.sendWeeklyAttendanceUpdates();
    
    return NextResponse.json({
      success: result.success,
      sentCount: result.sent,
      failedCount: result.failed,
      errors: result.errors.length > 0 ? result.errors.slice(0, 5) : []
    });
  } catch (error) {
    console.error('Error in weekly report API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Same handler for POST requests
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
