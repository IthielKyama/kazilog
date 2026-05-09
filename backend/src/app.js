const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Initialize express app
const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Basic Route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to KaziLog API' });
});

// Setup future routes here
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/logs', require('./routes/logbookRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/assessor', require('./routes/assessorRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? (err.statusCode || 500) : res.statusCode;
  let message = err.message;

  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value entered for ${field}. That ${field} already exists.`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

module.exports = app;
