const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

if (!process.env.MONGODB_URI) {
  console.error('Missing env var: MONGODB_URI');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('Missing env var: JWT_SECRET');
  process.exit(1);
}

// =====================
// Middleware
// =====================
app.use(express.json());
app.use(cors());

// =====================
// MongoDB Connection
// =====================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.log('MongoDB connection error:', err.message);
    process.exit(1);
  });

// =====================
// Routes Import
// =====================
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const fraudRoutes = require('./routes/fraud');

// =====================
// Routes Usage
// =====================
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/fraud', fraudRoutes);

// =====================
// Health Check Route
// =====================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
  });
});

// =====================
// Global Error Handler
// =====================
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    message: 'Something went wrong on the server',
  });
});

// =====================
// Server Start
// =====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
