# Notification Sounds

## Required Files
Place these files in this directory:
- `notification.mp3` - Main notification sound

## How to Add a Proper Sound File

1. Download a short notification sound from websites like:
   - https://mixkit.co/free-sound-effects/notification/
   - https://notificationsounds.com/

2. Rename the file to "notification.mp3" and place it in this directory

3. Restart your development server

## Troubleshooting

If you experience sound issues:
- Make sure the file is a valid MP3 file (not just a renamed text file)
- Keep the sound short (0.5 to 1.5 seconds)
- The system has fallbacks that will generate sounds if the file is missing

## Demo Notification

You can test notifications using the test button provided in the UI.
The NotificationTestButton component will play the sound and show a toast notification. 