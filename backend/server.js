const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

if (!process.env.MONGODB_URI) {
  console.error('❌ Missing MONGODB_URI');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('❌ Missing JWT_SECRET');
  process.exit(1);
}

app.use(express.json());

app.use(cors({
  origin: '*'
}));


app.get("/", (req, res) => {
  res.json({
    message: "Fraud Detection API is running 🚀",
    status: "OK"
  });
});


app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
    time: new Date()
  });
});


mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });


const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const fraudRoutes = require('./routes/fraud');

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/fraud', fraudRoutes);


app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    message: "Internal Server Error"
  });
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
