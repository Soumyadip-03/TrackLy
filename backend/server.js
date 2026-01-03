const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Import database manager
const dbManager = require('./utils/dbManager');

// Create Express app
const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// More flexible CORS settings
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'];
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));

// Create uploads directory structure if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const schedulesDir = path.join(uploadsDir, 'schedules');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(schedulesDir)) {
  fs.mkdirSync(schedulesDir, { recursive: true });
}

// Database connection with improved options for MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  family: 4, // Use IPv4, skip trying IPv6
  maxPoolSize: 100,
  minPoolSize: 5,
  maxIdleTimeMS: 120000,
  connectTimeoutMS: 10000,
  heartbeatFrequencyMS: 10000
})
.then(() => {
  console.log('Connected to MongoDB');
  // Initialize scheduler after DB connection is established
  try {
    require('./utils/scheduler');
  } catch (err) {
    console.warn('Scheduler initialization failed:', err.message);
  }
})
.catch(err => {
  console.error('MongoDB Atlas connection error:', err);
  if (err.name === 'MongoServerSelectionError') {
    console.error('Could not connect to MongoDB Atlas. Please check:');
    console.error('1. Your network connection');
    console.error('2. MongoDB Atlas connection string');
    console.error('3. IP whitelist settings in Atlas');
    console.error('4. Database user credentials');
  }
  // Don't exit - let the app run without DB for graceful error handling
  console.log('Application starting without database connection...');
});

// Handle MongoDB connection events
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection lost. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB connection reestablished');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/subject', require('./routes/subject'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/todo', require('./routes/todo'));
app.use('/api/notification', require('./routes/notification'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/project', require('./routes/project'));
app.use('/api/holidays', require('./routes/holiday'));
app.use('/api/academic-period', require('./routes/academicPeriod'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    dbReadyState: mongoose.connection.readyState
  });
});

// Simple HEAD request for minimal connectivity check
app.head('/api/health', (req, res) => {
  res.status(200).end();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  
  // Handle MongoDB connection errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    return res.status(503).json({
      success: false,
      error: 'Database service unavailable. Please try again later.'
    });
  }
  
  // Handle PDF parsing errors gracefully
  if (req.originalUrl.includes('/pdf')) {
    console.error('PDF processing error:', err);
    
    // Check for timeout/abort errors specifically
    if (err.name === 'AbortError' || err.message.includes('timeout') || err.message.includes('abort')) {
      return res.status(408).json({ 
        success: false, 
        error: 'PDF processing timed out. The file may be too complex or in an unsupported format.' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      error: 'PDF processing failed. Try a different format or upload a clearer document.' 
    });
  }
  
  // General error response
  res.status(500).json({
    success: false,
    error: err.message || 'Something went wrong'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await dbManager.closeAllConnections();
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await dbManager.closeAllConnections();
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
}); 