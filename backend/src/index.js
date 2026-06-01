const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const uploadsDir = path.join(__dirname, '..', 'uploads');
const assignmentUploadsDir = path.join(uploadsDir, 'assignments', 'submissions');

fs.mkdirSync(assignmentUploadsDir, { recursive: true });

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(uploadsDir));

// MongoDB Connection
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 50) + '...' : 'Not set');
    
    const mongooseOptions = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    };

    // Optional TLS overrides for development (set in .env if needed)
    if (process.env.MONGODB_TLS_ALLOW_INVALID === 'true') {
      mongooseOptions.tls = true;
      mongooseOptions.tlsAllowInvalidCertificates = true;
      mongooseOptions.tlsAllowInvalidHostnames = true;
      console.warn('WARNING: MongoDB TLS invalid certs allowed (MONGODB_TLS_ALLOW_INVALID=true)');
    }

    if (process.env.MONGODB_CA_FILE) {
      mongooseOptions.tlsCAFile = process.env.MONGODB_CA_FILE;
      console.log('Using custom CA file for MongoDB TLS from MONGODB_CA_FILE');
    }

    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/edu-orbit',
      mongooseOptions
    );
    
    console.log(' MongoDB connected successfully');
  } catch (err) {
    console.error(' MongoDB connection error:', err.message);
    console.error('Make sure:');
    console.error('  1. MongoDB Atlas cluster is accessible');
    console.error('  2. Your IP is whitelisted in MongoDB Atlas');
    console.error('  3. Database credentials are correct');
    console.error('  4. Internet connection is stable');
    
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// Health check endpoint
app.get('/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  const status = {
    server: 'running',
    mongodb: mongoStatus === 1 ? 'connected' : 'disconnected',
    mongoStatus: mongoStatus, // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    timestamp: new Date().toISOString()
  };
  
  res.json(status);
});

// Routes (only after attempting connection)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/teacher', require('./routes/teacher'));
app.use('/api/student', require('./routes/student'));
app.use('/api/parent', require('./routes/parent'));
app.use('/api/common', require('./routes/common'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
