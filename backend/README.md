# TrackLy Backend Server

This is the backend server for TrackLy, a student attendance tracking system. The server provides APIs for authentication, attendance tracking, notifications, and other features.

## Email Notification System

TrackLy includes a robust email notification system that can send:
- Welcome emails to new users
- Account creation confirmations
- Security alerts for login events
- Daily/weekly notification digests
- Custom notifications for events

### Setting Up Email Notifications

To set up email notifications, you need to configure your email credentials in the `config/config.env` file:

```
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_SERVICE=gmail
```

#### For Gmail Users (Recommended)

1. You must have 2-Step Verification enabled on your Google Account
2. Generate an App Password:
   - Go to your Google Account > Security > 2-Step Verification
   - At the bottom of the page, select "App passwords"
   - Select "Mail" and "Other (Custom name)" - name it "TrackLy"
   - Copy the generated 16-character password
   - Use this password as your `EMAIL_PASSWORD` in the config file (no spaces)

#### For Other Email Providers

For non-Gmail providers, set `EMAIL_SERVICE` to the appropriate email service (e.g., "hotmail", "outlook", "yahoo", etc.) and use your regular credentials.

### Testing Email Configuration

TrackLy provides several utility scripts to test your email configuration:

#### Check Email Configuration

```bash
npm run check-email
```

This will:
- Verify your email configuration
- Test the connection to the email server
- Report any issues found

#### Send Test Email

```bash
npm run test-email your-email@example.com
```

This will send a basic test email to verify your configuration is working.

#### Send Security Test Email

```bash
npm run test-security-email your-email@example.com
```

This will send a test security alert email with simulated login metadata.

#### Test New Account Emails

```bash
npm run test-account-emails your-email@example.com "Your Name"
```

This will send both the welcome email and account creation confirmation email that new users receive.

### Email Notification Types

TrackLy supports several types of email notifications:

1. **Account Related Emails**:
   - Welcome email with tips for getting started
   - Account creation confirmation with account details

2. **Security Emails**:
   - Login notifications with device and location details
   - Password change alerts
   - Email change confirmations

3. **Regular Notifications**:
   - **Instant Notifications**: Sent immediately when events occur
   - **Daily Digest**: A summary of the day's notifications
   - **Weekly Digest**: A summary of the week's notifications

Users can set their preferences in the app settings.

### Security Notifications

Security notifications are special high-priority emails sent for:
- New login events
- Password changes
- Email address changes
- Other security-related events

These emails include detailed metadata like:
- IP address
- Browser and device info
- Time of event
- Location (if available)

## API Documentation

### Authentication Routes

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/logout` - Logout user

### Notification Routes

- `GET /api/notification` - Get all notifications
- `GET /api/notification/unread` - Get unread notifications
- `POST /api/notification` - Create a notification
- `PUT /api/notification/:id/read` - Mark notification as read
- `PUT /api/notification/read-all` - Mark all notifications as read
- `DELETE /api/notification/:id` - Delete a notification
- `DELETE /api/notification/clear-read` - Delete all read notifications
- `PUT /api/notification/preferences` - Update notification preferences
- `POST /api/notification/welcome` - Send welcome email (admin only)
- `POST /api/notification/test-welcome` - Test welcome email (dev only)
- `POST /api/notification/test-security` - Test security email (dev only)

## Development

To start the development server:

```bash
npm run dev
```

## Production

To start the production server:

```bash
npm start
``` 