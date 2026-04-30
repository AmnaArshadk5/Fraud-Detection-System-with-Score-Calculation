const express = require('express');
const { body } = require('express-validator');

const Transaction = require('../models/Transaction');
const FraudAlert = require('../models/FraudAlert');
const RiskProfile = require('../models/RiskProfile');
const auth = require('../middleware/auth');
const handleValidationErrors = require('../middleware/validation');

const router = express.Router();

// =========================
// SAFE RISK SCORING
// =========================
const calculateRiskScore = async (transaction, userTransactions, userProfile) => {
  let riskScore = 0;
  const reasons = [];

  const avgAmount = userProfile.averageTransactionAmount || 0;

  // Rule 1: Amount anomaly
  if (avgAmount > 0) {
    const deviationRatio = transaction.amount / avgAmount;

    if (deviationRatio > 3) {
      riskScore += 30;
      reasons.push(`Unusual amount: ${deviationRatio.toFixed(2)}x average`);
    } else if (deviationRatio > 1.5) {
      riskScore += 15;
      reasons.push('Amount above average');
    }
  }

  // Rule 2: Category anomaly
  const categoryCount = userTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});

  if (!categoryCount[transaction.category] || categoryCount[transaction.category] < 2) {
    riskScore += 20;
    reasons.push(`Unusual category: ${transaction.category}`);
  }

  // Rule 3: Time-based anomaly (SAFE CHECK)
  const txTime = transaction.timestamp ? new Date(transaction.timestamp) : new Date();

  const last1Hour = new Date(txTime.getTime() - 60 * 60 * 1000);

  const recentTransactions = userTransactions.filter((t) => {
    if (!t.timestamp) return false;
    return new Date(t.timestamp) > last1Hour;
  });

  if (recentTransactions.length >= 3) {
    riskScore += 15;
    reasons.push(`${recentTransactions.length} transactions in last hour`);
  }

  // Rule 4: Location risk
  if (
    transaction.location &&
    userProfile.suspiciousLocations &&
    userProfile.suspiciousLocations.includes(transaction.location)
  ) {
    riskScore += 20;
    reasons.push(`Suspicious location: ${transaction.location}`);
  }

  // Rule 5: Fraud history
  const fraudRate =
    userProfile.totalTransactions > 0
      ? userProfile.fraudulentTransactions / userProfile.totalTransactions
      : 0;

  if (fraudRate > 0.1) {
    riskScore += 15;
    reasons.push('High fraud history');
  }

  return {
    riskScore: Math.min(riskScore, 100),
    reasons,
  };
};

// =========================
// ANALYZE TRANSACTION
// =========================
router.post(
  '/analyze',
  auth,
  [body('transactionId').isMongoId().withMessage('Valid transactionId is required')],
  handleValidationErrors,
  async (req, res) => {
  try {
    const { transactionId } = req.body;

    const transaction = await Transaction.findOne({
      _id: transactionId,
      userId: req.userId,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const userTransactions = await Transaction.find({ userId: req.userId });

    let riskProfile = await RiskProfile.findOne({ userId: req.userId });

    if (!riskProfile) {
      riskProfile = await RiskProfile.create({ userId: req.userId });
    }

    // SAFE AVERAGE CALCULATION
    const total = userTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    riskProfile.totalTransactions = userTransactions.length;
    riskProfile.averageTransactionAmount =
      userTransactions.length > 0 ? total / userTransactions.length : 0;

    await riskProfile.save();

    const { riskScore, reasons } = await calculateRiskScore(
      transaction,
      userTransactions,
      riskProfile
    );

    let severity = 'low';
    if (riskScore >= 70) severity = 'critical';
    else if (riskScore >= 50) severity = 'high';
    else if (riskScore >= 30) severity = 'medium';

    const fraudAlert = await FraudAlert.create({
      userId: req.userId,
      transaction: transactionId,
      riskScore,
      reasons,
      severity,
      status: riskScore >= 50 ? 'flagged' : 'reviewed',
    });

    transaction.isFlagged = riskScore >= 50;
    transaction.fraudAlert = fraudAlert._id;
    await transaction.save();

    riskProfile.overallRiskScore = Math.max(riskProfile.overallRiskScore || 0, riskScore);

    riskProfile.fraudulentTransactions = await FraudAlert.countDocuments({
      userId: req.userId,
      status: { $in: ['flagged', 'confirmed'] },
    });

    await riskProfile.save();

    res.json({
      message: 'Transaction analyzed',
      riskScore,
      severity,
      reasons,
      fraudAlert,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
  }
);

// =========================
// ALERTS
// =========================
router.get('/alerts', auth, async (req, res) => {
  try {
    const alerts = await FraudAlert.find({ userId: req.userId })
      .populate('transaction')
      .sort({ createdAt: -1 });

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================
// UPDATE ALERT
// =========================
router.put(
  '/alerts/:alertId',
  auth,
  [body('status').isIn(['flagged', 'reviewed', 'cleared', 'confirmed']).withMessage('Invalid status')],
  handleValidationErrors,
  async (req, res) => {
  try {
    const alert = await FraudAlert.findOne({
      _id: req.params.alertId,
      userId: req.userId,
    });

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    alert.status = req.body.status;

    if (['cleared', 'reviewed'].includes(req.body.status)) {
      alert.resolvedAt = new Date();
    }

    await alert.save();

    res.json({ message: 'Alert updated', alert });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
  }
);

// =========================
// RISK PROFILE
// =========================
router.get('/risk-profile', auth, async (req, res) => {
  try {
    let profile = await RiskProfile.findOne({ userId: req.userId });

    if (!profile) {
      profile = await RiskProfile.create({ userId: req.userId });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
