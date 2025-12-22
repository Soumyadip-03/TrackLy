import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
  secure: process.env.EMAIL_SMTP_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASSWORD || '',
  },
});

export async function POST(request: NextRequest) {
  try {
    // Verify API key for security
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.EMAIL_API_KEY;
    
    if (apiKey && (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== apiKey)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { to, subject, body: emailBody, isHtml, from, replyTo, attachments } = body;

    // Validate required fields
    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Configure email options
    const mailOptions = {
      from: from || process.env.EMAIL_FROM || 'noreply@trackly.app',
      to,
      subject,
      ...(isHtml ? { html: emailBody } : { text: emailBody }),
      ...(replyTo ? { replyTo } : {}),
      ...(attachments ? { attachments } : {}),
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
    });
  } catch (error: any) {
    console.error('Email sending error:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to send email',
        error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
      },
      { status: 500 }
    );
  }
}
