const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env variables
dotenv.config();

const app = express();

// =====================
// ENV CHECKS
// =====================
if (!process.env.MONGODB_URI) {
  console.error('❌ Missing MONGODB_URI');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('❌ Missing JWT_SECRET');
  process.exit(1);
}

// =====================
// MIDDLEWARE
// =====================
app.use(express.json());

// Allow frontend access
app.use(cors({
  origin: '*'
}));

// =====================
// ROOT ROUTE (FIX "Cannot GET /")
// =====================
app.get("/", (req, res) => {
  res.json({
    message: "Fraud Detection API is running 🚀",
    status: "OK"
  });
});

// =====================
// HEALTH CHECK
// =====================
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
    time: new Date()
  });
});

// =====================
// MONGODB CONNECTION
// =====================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// =====================
// ROUTES
// =====================
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const fraudRoutes = require('./routes/fraud');

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/fraud', fraudRoutes);

// =====================
// GLOBAL ERROR HANDLER
// =====================
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    message: "Internal Server Error"
  });
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
