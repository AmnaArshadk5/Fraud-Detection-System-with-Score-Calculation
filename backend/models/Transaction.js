const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['debit', 'credit'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: String,
  location: String,
  deviceId: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  fraudAlert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FraudAlert'
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
