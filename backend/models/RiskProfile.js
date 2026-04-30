const mongoose = require('mongoose');

const riskProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  overallRiskScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalTransactions: {
    type: Number,
    default: 0
  },
  fraudulentTransactions: {
    type: Number,
    default: 0
  },
  averageTransactionAmount: {
    type: Number,
    default: 0
  },
  highRiskCategories: [String],
  suspiciousLocations: [String],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('RiskProfile', riskProfileSchema);
