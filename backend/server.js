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

<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
app.use(express.json());

<<<<<<< Updated upstream
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

=======
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/fraud', fraudRoutes);

<<<<<<< Updated upstream
=======
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
  });
});
>>>>>>> Stashed changes

app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    message: "Internal Server Error"
  });
});

<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
