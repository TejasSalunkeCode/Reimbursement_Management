'use strict';

const { Router } = require('express');

const router = Router();

// ── Health check ──────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is running 🚀', timestamp: new Date() });
});

// ── Feature routes ───────────────────────────────────────────────────────────
const authRoutes      = require('./auth.routes');
const userRoutes      = require('./user.routes');
const expenseRoutes   = require('./expense.routes');
const approvalRoutes  = require('./approval.routes');
const currencyRoutes  = require('./currency.routes');
const ocrRoutes       = require('./ocr.routes');

router.use('/auth',      authRoutes);
router.use('/users',     userRoutes);
router.use('/expenses',  expenseRoutes);
router.use('/approvals', approvalRoutes);
router.use('/currency',  currencyRoutes);
router.use('/ocr',       ocrRoutes);

module.exports = router;
