const express = require('express');
const { body } = require('express-validator');
const mongoose = require('mongoose');

const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const handleValidationErrors = require('../middleware/validation');

const router = express.Router();

// =========================
// ADD TRANSACTION
// =========================
router.post(
  '/',
  auth,
  [
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
    body('type').isIn(['debit', 'credit']).withMessage('Type must be debit or credit'),
    body('category').notEmpty().withMessage('Category is required'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { amount, type, category, description, location, deviceId } = req.body;

      const transaction = new Transaction({
        userId: req.userId,
        amount,
        type,
        category,
        description,
        location,
        deviceId,
      });

      await transaction.save();

      res.status(201).json({
        message: 'Transaction added successfully',
        transaction,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// =========================
// GET ALL TRANSACTIONS
// =========================
router.get('/', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.userId,
    }).sort({ timestamp: -1 });

    res.json(transactions);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================
// HIGH RISK TRANSACTIONS
// =========================
router.get('/high-risk', auth, async (req, res) => {
  try {
    const data = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.userId),
          isFlagged: true,
        },
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
    ]);

    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================
// TRANSACTION TRENDS
// =========================
router.get('/trends', auth, async (req, res) => {
  try {
    const data = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.userId),
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$timestamp',
            },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $sort: { _id: -1 },
      },
      {
        $limit: 30,
      },
    ]);

    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
